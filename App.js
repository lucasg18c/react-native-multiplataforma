import React, {useEffect, useRef} from 'react';
import {BleManager} from 'react-native-ble-plx';
import {request, requestMultiple} from 'react-native-permissions';
import WebView from 'react-native-webview';

const ble = new BleManager();

export default function App() {
  useEffect(() => {
    requestMultiple([
      'android.permission.BLUETOOTH_CONNECT',
      'android.permission.BLUETOOTH_SCAN',
      'android.permission.ACCESS_FINE_LOCATION',
    ]);
  }, []);

  const web = useRef(null);

  const buscarDispositivoBLE = () => {
    console.log('Buscando dispositivos');
    ble.startDeviceScan(null, null, async (error, device) => {
      if (error) {
        console.log('Error ' + error.message);
        return;
      }

      const deviceJSON = {
        deviceID: device.id,
        manufacturer: device.manufacturerData,
        rssi: device.rssi,
      };

      console.log(`Device found ${JSON.stringify(deviceJSON)}`);
      web.current.injectJavaScript(
        `dispositivoEncontrado(${JSON.stringify(deviceJSON)})`,
      );
    });
  };

  const handleMessage = evento => {
    console.log('Evento recibido ' + evento.nativeEvent.data);
    switch (evento.nativeEvent.data) {
      case 'buscarDispositivosBLE':
        buscarDispositivoBLE();
        break;
      case 'conectarBLE':
        break;
      case 'desconectarBLE':
        break;
      case 'escribirBLE':
        break;
      case 'detenerBusquedaBLE':
        break;
      case 'setIndicacionesBLE':
        break;
      case 'detenerRespuestasBLE':
        break;
      case 'escucharBLE':
        break;
      case 'setNotificacionesBLE':
        break;
      case 'negociarMTUBLE':
        break;
    }
  };

  return (
    <WebView
      source={{uri: 'http://192.168.0.106:8080'}}
      onMessage={handleMessage}
      ref={web}
    />
  );
}
