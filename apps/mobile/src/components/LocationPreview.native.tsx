import MapView, { Marker } from 'react-native-maps';
import { StyleSheet } from 'react-native';
export function LocationPreview({ latitude, longitude }: { latitude: number; longitude: number }) { return <MapView pointerEvents="none" style={styles.map} initialRegion={{ latitude, longitude, latitudeDelta: 0.015, longitudeDelta: 0.015 }}><Marker coordinate={{ latitude, longitude }} /></MapView>; }
const styles = StyleSheet.create({ map: { height: 210, width: '100%', borderRadius: 14 } });

