import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebaseConfig';


const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const MAX_ATTEMPTS = 5;


export default function Original() {
  const [film, setFilm] = useState(null);
  const [guessed, setGuessed] = useState([]);
  const [wrong, setWrong] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [loading, setLoading] = useState(true);
  const [win, setWin] = useState(0);
  const [lose, setLose] = useState(0);
  const uid = auth.currentUser?.uid;


  const title = film ? film.title.toUpperCase() : '';
  const isLetter = (c) => /[A-Z]/.test(c);


  const nuevaPelicula = async () => {
    setLoading(true);
    setGuessed([]); setWrong(0); setGameOver(false); setGameWon(false);
    try {
      const res = await fetch('https://ghibliapi.vercel.app/films');
      const films = await res.json();
      setFilm(films[Math.floor(Math.random() * films.length)]);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };


  useEffect(() => {
    nuevaPelicula();
    if (!uid) return;
    (async () => {
      try {
        const ref = doc(db, 'usuarios', uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setWin(snap.data().ganados || 0);
          setLose(snap.data().perdidos || 0);
        } else {
          await setDoc(ref, { ganados: 0, perdidos: 0 });
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [uid]);


  const guardar = async (acierto) => {
    if (!uid) return;
    try {
      await addDoc(collection(db, 'resultados'), {
  uid,
  pelicula: film.title,
  acierto,
  fecha: new Date().toISOString(),
});
await updateDoc(doc(db, 'usuarios', uid), {
  [acierto ? 'ganados' : 'perdidos']: increment(1),
});
    } catch (e) {
      console.error(e);
    }
  };


  const onLetter = async (letter) => {
    if (guessed.includes(letter) || gameOver || gameWon) return;
    const updated = [...guessed, letter];
    setGuessed(updated);


    if (!title.includes(letter)) {
      const w = wrong + 1;
      setWrong(w);
      if (w >= MAX_ATTEMPTS) {
        setGameOver(true); setLose(lose + 1); await guardar(false);
      }
    } else if (title.split('').every((c) => !isLetter(c) || updated.includes(c))) {
      setGameWon(true); setWin(win + 1); await guardar(true);
    }
  };


  const show = (c) => (!isLetter(c) || guessed.includes(c) || gameOver ? c : '_');


  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Adivina la película Ghibli</Text>
      <Text>Ganados: {win} | Perdidos: {lose}</Text>
      {loading || !film ? <ActivityIndicator size="large" /> : (
        <>
          <Image source={{ uri: film.image }} style={styles.image} blurRadius={gameOver || gameWon ? 0 : 15} />
          <Text style={styles.word}>{title.split('').map(show).join(' ')}</Text>
          <View style={styles.keyboard}>
            {ALPHABET.map((l) => (
              <TouchableOpacity key={l} onPress={() => onLetter(l)}
                disabled={guessed.includes(l) || gameOver || gameWon}
                style={[styles.key, guessed.includes(l) && styles.keyDisabled]}>
                <Text>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text>Fallos: {wrong} / {MAX_ATTEMPTS}</Text>
          {gameOver && <Text style={styles.lost}>💀 ¡Perdiste! Era: {film.title}</Text>}
          {gameWon && <Text style={styles.won}>🎉 ¡Ganaste!</Text>}
          {(gameOver || gameWon) && (
            <TouchableOpacity style={styles.button} onPress={nuevaPelicula}>
              <Text style={styles.buttonText}>Jugar otra vez</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center' },
  title: { fontSize: 22, marginBottom: 10 },
  image: { width: 200, height: 280, marginVertical: 10, resizeMode: 'contain' },
  word: { fontSize: 22, letterSpacing: 2, marginVertical: 15, textAlign: 'center' },
  keyboard: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 15 },
  key: { backgroundColor: '#eee', padding: 10, margin: 4, borderRadius: 4, width: 40, alignItems: 'center' },
  keyDisabled: { backgroundColor: '#ccc' },
  lost: { color: 'red', fontSize: 18 },
  won: { color: 'green', fontSize: 18 },
  button: { marginTop: 10, padding: 10, backgroundColor: '#0066cc', borderRadius: 5 },
  buttonText: { color: 'white', fontWeight: 'bold' },
});