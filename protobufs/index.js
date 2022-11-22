import Description from './description_pb'
import DS18X20 from './ds18x20_pb'
import I2C from './i2c_pb'
import Pin from './pin_pb'
import PWM from './pwm_pb'
import Servo from './servo_pb'
import Signal from './signal_pb'


export default {
  ...Description,
  ...DS18X20,
  ...I2C,
  ...Pin,
  ...PWM,
  ...Servo,
  ...Signal,
}
