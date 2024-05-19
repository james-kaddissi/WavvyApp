import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, PanResponder, Animated, Easing, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';

const App = () => {
  const [status, setStatus] = useState('Idle');
  const [timeoutId, setTimeoutId] = useState(null);
  const [recording, setRecording] = useState(null);
  const [sound, setSound] = useState(null);
  const [recordingUri, setRecordingUri] = useState(null);
  const [sliderValue, setSliderValue] = useState(0);
  const rotation = useRef(new Animated.Value(0)).current;
  const [angleOffset, setAngleOffset] = useState(0);
  const currentVelocity = useRef(0);

  const sliderHeight = 300;

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      if (status === 'Recording...' || status === 'Playing...') {
        stopRotation();
      }
    },
    onPanResponderMove: (e, gestureState) => {
      const newAngle = angleOffset + gestureState.dx / 2;
      rotation.setValue(newAngle);
    },
    onPanResponderRelease: (e, gestureState) => {
      setAngleOffset(angleOffset + gestureState.dx / 2);
      if (status === 'Recording...' || status === 'Playing...') {
        startRotation();
      }
    },
  });

  useEffect(() => {
    if (status === 'Stopped') {
      const id = setTimeout(() => {
        setStatus('Idle');
      }, 10000);
      setTimeoutId(id);
    } else if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }, [status]);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  useEffect(() => {
    if (status === 'Recording...' || status === 'Playing...') {
      startRotation();
    } else {
      stopRotation();
    }
  }, [status]);

  const startRotation = () => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: angleOffset + 360,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopRotation = () => {
    rotation.stopAnimation((value) => {
      setAngleOffset(value % 360);
    });
  };

  const handleRecord = async () => {
    if (status === 'Playing...') {
      await handleStop();
    }

    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === 'granted') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          playsInSilentModeIOS: true,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
          shouldDuckAndroid: true,
          staysActiveInBackground: true,
          playThroughEarpieceAndroid: true,
        });

        setStatus('Recording...');
        const { recording } = await Audio.Recording.createAsync(
          Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
        );
        setRecording(recording);
      } else {
        console.log('Permission to access microphone is required!');
      }
    } catch (error) {
      console.error('Failed to start recording', error);
    }
  };

  const handleStop = async () => {
    if (recording) {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log('Recording saved at', uri);
      setStatus('Stopped');
      setRecordingUri(uri);
      setRecording(null);
      return uri;
    }
    if (status === 'Playing...') {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }
      setStatus('Stopped');
      return recordingUri;
    }
    return null;
  };

  const handlePlay = async () => {
    let uri = recordingUri;

    if (status === 'Recording...') {
      setStatus('Stopping...');
      uri = await handleStop();
    }

    if (uri) {
      setStatus('Playing...');
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: uri },
        { shouldPlay: true },
        (status) => {
          if (status.didJustFinish) {
            setStatus('Idle');
          }
        }
      );
      setSound(newSound);
      await newSound.playAsync();
    } else {
      console.log('No recording available to play');
    }
  };

  const handleSlider = (e, gestureState) => {
    const positionY = gestureState.moveY - (Dimensions.get('window').height - sliderHeight) / 2;
    const value = 1 - (2 * positionY) / sliderHeight;
    setSliderValue(Math.max(-1, Math.min(1, value)));
  };

  useEffect(() => {
    let animationFrame;
    const updateRotation = () => {
      currentVelocity.current += sliderValue * 0.05; // Adjust multiplier for sensitivity
      rotation.setValue(currentVelocity.current * 360);
      animationFrame = requestAnimationFrame(updateRotation);
    };

    if (sliderValue !== 0) {
      animationFrame = requestAnimationFrame(updateRotation);
    } else {
      cancelAnimationFrame(animationFrame);
    }

    return () => cancelAnimationFrame(animationFrame);
  }, [sliderValue]);

  const combinedRotation = rotation.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  const sliderResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: handleSlider,
    onPanResponderGrant: handleSlider,
    onPanResponderRelease: () => {
      if (status === 'Recording...' || status === 'Playing...') {
        startRotation();
      }
      setSliderValue(0);
    },
  });

  return (
    <View style={styles.container}>
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.wheel,
          {
            transform: [{ rotate: combinedRotation }],
          },
        ]}
      >
        <LinearGradient
          colors={['#d1d1d1', '#a7a7a7', '#c7c7c7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.innerCircle}
        />
        <View style={[styles.line, styles.line1]} />
        <View style={[styles.line, styles.line2]} />
      </Animated.View>
      <View style={styles.sidebarContainer}>
        <View style={styles.sidebar} {...sliderResponder.panHandlers}>
          <View style={styles.symbolTop}>
            <Icon name="play-arrow" size={20} color="white" />
            <Icon name="play-arrow" size={20} color="white" style={{ marginLeft: -10 }} />
          </View>
          <View style={styles.symbolBottom}>
            <Icon name="play-arrow" size={20} color="white" />
            <Text style={styles.reverseText}>R</Text>
          </View>
        </View>
      </View>
      <View style={styles.screen}>
        <Text style={styles.screenText}>{status}</Text>
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={handleRecord}>
          <Icon name="fiber-manual-record" size={30} color="red" style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handlePlay}>
          <Icon name="play-arrow" size={30} color="black" style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleStop} disabled={status === 'Idle' || status === 'Stopped'}>
          <Icon name="stop" size={30} color="black" style={styles.icon} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#C7C7C7',
  },
  wheel: {
    width: 350,
    height: 350,
    borderRadius: 175,
    borderWidth: 0.5,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 50,
  },
  innerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  line: {
    position: 'absolute',
    width: 1,
    height: 115,
    backgroundColor: 'gray',
  },
  line1: {
    top: 5,
    transform: [{ rotate: '0deg' }],
  },
  line2: {
    bottom: 5,
    transform: [{ rotate: '180deg' }],
  },
  sidebarContainer: {
    position: 'absolute',
    left: 0,
    top: 100,
    width: 15,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#C7C7C7',
  },
  sidebar: {
    width: '100%',
    top: 150,
    height: '100%',
    backgroundColor: '#C7C7C7',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#000',
    borderRadius: 5,
    paddingVertical: 10,
  },
  symbolTop: {
    flexDirection: 'row',
    position: 'absolute',
    left: 20,
    transform: [{ rotate: '270deg' }]
  },
  symbolBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    left: 20,
    bottom: 0,
    transform: [{ rotate: '90deg' }],
  },
  reverseText: {
    color: 'white',
    fontSize: 15,
    marginRight: 5,
    transform: [{ rotate: '180deg' }],
  },
  screen: {
    position: 'absolute',
    top: 100,
    right: 30,
    width: 140,
    height: 80,
    borderRadius: 10,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenText: {
    color: 'white',
    fontFamily: 'Courier',
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '75%',
    height: 200,
  },
  button: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 5,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 10,
    height: '100%',
  },
  icon: {
    marginTop: 10,
  },
});

export default App;
