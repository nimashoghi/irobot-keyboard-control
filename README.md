# iRobot Keyboard Control

This package provides a very easy console-based way of controlling the iRobot Create bot with your keyboard.

### Pre-requisites

Make sure you have docker installed on your Raspberry Pi. Also, make sure your Pi is connected to the iRobot through the serial port.

### Usage

Run the following command to start the keyboard control:

```bash
docker run -it --privileged --rm nimashoghi/keyboard-control
```

If the iRobot's serial port is not `/dev/ttyUSB0`, then you can change it by using the `ROBOT_SERIAL` environment variable. For example:

```
docker run -it --privileged --rm -e "ROBOT_SERIAL=/dev/ttyUSB1" nimashoghi/keyboard-control
```

You can also adjust the baudrate using the `ROBOT_BAUD_RATE` environment variable:

```
docker run -it --privileged --rm -e "ROBOT_BAUD_RATE=115200" nimashoghi/keyboard-control
```
