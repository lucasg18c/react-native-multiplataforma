import React, {useEffect, useRef} from 'react';
import {BleManager} from 'react-native-ble-plx';
import {requestMultiple} from 'react-native-permissions';
import WebView from 'react-native-webview';
import {Base64Binary} from './Base64';
import {Buffer} from 'buffer';

import {LogBox} from 'react-native';
LogBox.ignoreLogs(['new NativeEventEmitter']); // Ignore log notification by message
LogBox.ignoreAllLogs(); //Ignore all log notifications
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

  const buscarDispositivos = _ => {
    ble.startDeviceScan(null, null, async (error, device) => {
      if (error) {
        console.log('Error ' + error.message);
        return;
      }

      const deviceJSON = {
        deviceID: device.id,
        manufacturer: Base64Binary.decode(device.manufacturerData),
        rssi: device.rssi,
      };

      console.log(`(${JSON.stringify(deviceJSON)})`);
      enviar(`dispositivoEncontrado(${JSON.stringify(deviceJSON)})`);
    });
  };

  const enviar = mensaje => {
    web.current.injectJavaScript(mensaje);
  };

  let dispositivoConectado;
  const conectar = async parametros => {
    let res = await ble.connectToDevice(parametros.deviceID);
    console.log(`Conexión a ${res.id} - estado ${await res.isConnected()}`);
    res = await res.discoverAllServicesAndCharacteristics();
    let mensaje = {
      deviceID: res.id,
      estado: '',
    };
    if (await res.isConnected()) {
      console.log(`Conexión a ${res.id} - estado: listo`);
      mensaje.estado = 'listo';
      dispositivoConectado = res;
    } else {
      mensaje.estado = 'error';
    }
    console.log(mensaje);
    enviar(`estadoConexion(${JSON.stringify(mensaje)})`);
  };

  const desconectar = async _ => {
    if (dispositivoConectado && (await dispositivoConectado.isConnected())) {
      if (escuchando) {
        detenerRespuestas({charID: escuchando});
        escuchando = '';
      }
      const deviceID = dispositivoConectado.id;
      await dispositivoConectado.cancelConnection();
      dispositivoConectado = null;
      enviar(
        `estadoConexion({deviceID: "${deviceID}", estado: "disconnected" })`,
      );
    }
  };

  const escribir = async parametros => {
    const char = await buscarCaracteristica(
      parametros.serviceID,
      parametros.charID,
    );
    var base64String = Buffer.from(parametros.valor, 'hex').toString('base64');
    console.log(`mensaje ${parametros.valor}`);
    char.writeWithResponse(base64String);
  };

  const detenerBusqueda = _ => {
    console.log('Busqueda detenida');
    ble.stopDeviceScan();
  };

  const buscarCaracteristica = async (serviceID, charID) => {
    const servicios = await dispositivoConectado.services();
    const chars = await servicios
      .find(s => s.uuid === serviceID)
      .characteristics();
    return chars.find(c => c.uuid === charID);
  };

  const setIndicaciones = async parametros => {
    const char = await buscarCaracteristica(
      parametros.serviceID,
      parametros.charID,
    );
    char.isIndicatable = parametros.esIndicable;
    console.log(`char ${char.uuid} es indicable ${char.isIndicatable}`);
  };

  const detenerRespuestas = async parametros => {
    console.log(`Deteniendo respuestas de ${parametros.charID}`);
    ble.cancelTransaction(parametros.charID);
  };

  let escuchando;
  const escuchar = async parametros => {
    const char = await buscarCaracteristica(
      parametros.serviceID,
      parametros.charID,
    );
    //const chars = await ble.characteristicsForDevice();

    escuchando = parametros.charID;
    char.monitor((error, c) => {
      if (error) {
        console.log(`Error al escuchar ${error}`);
        return;
      }
      const answer = {
        charID: c.uuid,
        valor: Buffer.from(c.value, 'base64').toString('hex'),
      };
      console.log(`answer ${JSON.stringify(answer)}`);
      enviar(`answer( ${JSON.stringify(answer)} )`);
    }, parametros.charID);
  };

  const setNotificaciones = parametros => {};

  const negociarMTU = parametros => {};

  const handleMessage = evento => {
    const {funcion, parametros} = JSON.parse(evento.nativeEvent.data);

    switch (funcion) {
      case 'buscarDispositivosBLE':
        buscarDispositivos(parametros);
        break;
      case 'conectarBLE':
        conectar(parametros);
        break;
      case 'desconectarBLE':
        desconectar(parametros);
        break;
      case 'escribirBLE':
        escribir(parametros);
        break;
      case 'detenerBusquedaBLE':
        detenerBusqueda(parametros);
        break;
      case 'setIndicacionesBLE':
        setIndicaciones(parametros);
        break;
      case 'detenerRespuestasBLE':
        detenerRespuestas(parametros);
        break;
      case 'escucharBLE':
        escuchar(parametros);
        break;
      case 'setNotificacionesBLE':
        setNotificaciones(parametros);
        break;
      case 'negociarMTUBLE':
        negociarMTU(parametros);
        break;
    }
  };

  return (
    <WebView
      source={{uri: 'http://172.16.17.116:8080'}}
      onMessage={handleMessage}
      ref={web}
    />
  );
}
