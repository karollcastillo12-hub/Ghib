import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Image } from 'react-native';


export default function Home() {
  const [films, setFilms] = useState([]);


  useEffect(() => {
    fetch('https://ghibliapi.vercel.app/films')
      .then((res) => res.json())
      .then(setFilms)
      .catch(console.error);
  }, []);


  return (
    <ScrollView>
      <View style={styles.lista}>
        {films.map((f) => (
          <View key={f.id} style={styles.item}>
            <Image source={{ uri: f.image }} style={styles.imagen} />
            <Text style={styles.titulo}>{f.title}</Text>
            <Text>{f.release_date} · {f.director}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  lista: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', padding: 10 },
  item: { backgroundColor: 'aliceblue', width: '48%', padding: 10, alignItems: 'center', marginBottom: 10 },
  imagen: { width: 100, height: 150, resizeMode: 'contain' },
  titulo: { fontWeight: 'bold', textAlign: 'center', marginTop: 5 },
});