import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import {
  doc, getDoc, setDoc, increment, collection, query, orderBy, limit, getDocs,
} from 'firebase/firestore';
import { auth, db } from '../../firebase/firebaseConfig';

const PARES = 6;

const barajar = (arr) => [...arr].sort(() => Math.random() - 0.5);

const crearTablero = (films) => {
  const elegidas = barajar(films.filter((f) => f.image)).slice(0, PARES);
  const cartas = elegidas.flatMap((f) => [
    { key: `${f.id}-a`, id: f.id, image: f.image, title: f.title },
    { key: `${f.id}-b`, id: f.id, image: f.image, title: f.title },
  ]);
  return barajar(cartas);
};

export default function Original() {
  const uid = auth.currentUser?.uid;

  const [films, setFilms] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cartas, setCartas] = useState([]);
  const [volteadas, setVolteadas] = useState([]);
  const [encontradas, setEncontradas] = useState([]);
  const [movimientos, setMovimientos] = useState(0);
  const [bloqueado, setBloqueado] = useState(false);
  const [terminado, setTerminado] = useState(false);
  const [mejor, setMejor] = useState(0);
  const [partidas, setPartidas] = useState(0);
  const [ranking, setRanking] = useState([]);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await fetch('https://ghibliapi.vercel.app/films');
        const data = await res.json();
        setFilms(data);
        setCartas(crearTablero(data));

        if (uid) {
          const snap = await getDoc(doc(db, 'usuarios', uid));
          if (snap.exists()) {
            setMejor(snap.data().mejorMovimientos || 0);
            setPartidas(snap.data().partidas || 0);
          }
        }
      } catch (e) {
        console.error(e);
      }
      setCargando(false);
    };
    cargar();
  }, [uid]);

  const reiniciar = () => {
    setCartas(crearTablero(films));
    setVolteadas([]);
    setEncontradas([]);
    setMovimientos(0);
    setBloqueado(false);
    setTerminado(false);
  };

  const terminar = async (movs) => {
    setTerminado(true);
    const nuevoMejor = mejor === 0 ? movs : Math.min(mejor, movs);
    setMejor(nuevoMejor);
    setPartidas((p) => p + 1);

    if (!uid) return;
    try {
      await setDoc(
        doc(db, 'usuarios', uid),
        { partidas: increment(1), mejorMovimientos: nuevoMejor },
        { merge: true }
      );

      const q = query(collection(db, 'usuarios'), orderBy('mejorMovimientos', 'asc'), limit(5));
      const snap = await getDocs(q);
      setRanking(snap.docs.map((d) => d.data()));
    } catch (e) {
      console.error('Error al guardar:', e);
    }
  };

  const tocarCarta = (i) => {
    if (bloqueado || terminado) return;
    if (volteadas.includes(i) || encontradas.includes(cartas[i].id)) return;

    const nuevas = [...volteadas, i];
    setVolteadas(nuevas);

    if (nuevas.length === 2) {
      const movs = movimientos + 1;
      setMovimientos(movs);
      setBloqueado(true);

      const [a, b] = nuevas;
      if (cartas[a].id === cartas[b].id) {
        const nuevasEnc = [...encontradas, cartas[a].id];
        setEncontradas(nuevasEnc);
        setVolteadas([]);
        setBloqueado(false);
        if (nuevasEnc.length === PARES) terminar(movs);
      } else {
        setTimeout(() => {
          setVolteadas([]);
          setBloqueado(false);
        }, 800);
      }
    }
  };

  if (cargando) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

  if (films.length === 0) {
    return <Text style={styles.error}>No se pudieron cargar las películas. Revisa tu conexión.</Text>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>🌿 Memoria Ghibli</Text>

      <View style={styles.barra}>
        <Text style={styles.stat}>Movimientos: {movimientos}</Text>
        <Text style={styles.stat}>🏆 Mejor: {mejor === 0 ? '-' : mejor}</Text>
        <Text style={styles.stat}>🎮 {partidas}</Text>
      </View>

      <View style={styles.tablero}>
        {cartas.map((c, i) => {
          const visible = volteadas.includes(i) || encontradas.includes(c.id);
          return (
            <TouchableOpacity
              key={c.key}
              style={[styles.carta, encontradas.includes(c.id) && styles.cartaEncontrada]}
              onPress={() => tocarCarta(i)}
              activeOpacity={0.8}
            >
              {visible ? (
                <Image source={{ uri: c.image }} style={styles.imagen} />
              ) : (
                <Text style={styles.reverso}>🌿</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {terminado && (
        <View style={styles.final}>
          <Text style={styles.ganaste}>🎉 ¡Lo lograste en {movimientos} movimientos!</Text>
          {movimientos <= mejor && <Text style={styles.record}>⭐ ¡Nuevo récord personal!</Text>}

          <Text style={styles.subtitulo}>🏆 Mejores jugadores</Text>
          {ranking.length === 0 ? (
            <Text>Cargando ranking...</Text>
          ) : (
            ranking.map((r, i) => (
              <View key={i} style={styles.filaRanking}>
                <Text style={styles.rankTexto}>{i + 1}. {r.nombre || 'Anónimo'}</Text>
                <Text style={styles.rankTexto}>{r.mejorMovimientos} mov.</Text>
              </View>
            ))
          )}
        </View>
      )}

      <TouchableOpacity style={styles.boton} onPress={reiniciar}>
        <Text style={styles.botonTexto}>{terminado ? 'Jugar otra vez' : 'Reiniciar'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 15, alignItems: 'center' },
  titulo: { fontSize: 26, fontWeight: 'bold', marginVertical: 15 },
  barra: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 10 },
  stat: { fontSize: 15 },
  tablero: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%' },
  carta: {
    width: '31%', height: 150, backgroundColor: '#dbe7f5', borderRadius: 8, marginBottom: 10,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  cartaEncontrada: { borderWidth: 3, borderColor: '#2e9e4f' },
  imagen: { width: '100%', height: '100%', resizeMode: 'cover' },
  reverso: { fontSize: 40 },
  boton: { backgroundColor: '#0066cc', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 8, marginTop: 10 },
  botonTexto: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  final: { width: '100%', alignItems: 'center', marginTop: 10 },
  ganaste: { fontSize: 20, fontWeight: 'bold', color: 'green', textAlign: 'center' },
  record: { fontSize: 16, color: '#b8860b', fontWeight: 'bold', marginTop: 5 },
  subtitulo: { fontSize: 20, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  filaRanking: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', backgroundColor: 'aliceblue', padding: 10, borderRadius: 6, marginBottom: 6 },
  rankTexto: { fontSize: 16 },
  error: { color: 'red', textAlign: 'center', marginTop: 50 },
});