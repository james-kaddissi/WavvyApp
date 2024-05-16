import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, PanResponder } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const App = () => {
  const [angle, setAngle] = useState(0);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (e, gestureState) => {
      const newAngle = angle + gestureState.dx / 2;
      setAngle(newAngle);
    }
  });

  return (
    <View style={styles.container}>
      <View {...panResponder.panHandlers} style={[styles.wheel, { transform: [{ rotate: `${angle}deg` }] }]}>
        <View style={styles.innerCircle} />
        <View style={[styles.line, styles.line1]} />
        <View style={[styles.line, styles.line2]} />
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={() => {}}>
          <Icon name="fiber-manual-record" size={30} color="red" style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => {}}>
          <Icon name="play-arrow" size={30} color="black" style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => {}}>
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
    backgroundColor: 'gray',
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
