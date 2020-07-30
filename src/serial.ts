import SerialPort from "serialport"
// @ts-ignore
import struct = require("python-struct")

//#region Settings
const SERIAL = process.env.ROBOT_SERIAL ?? "/dev/ttyUSB0"
const BAUD_RATE = parseInt(process.env.ROBOT_BAUD_RATE ?? "115200")
//#endregion

const sendStartSequence = async (connection: SerialPort) => {
    await executeCommand(connection, Buffer.from([0x80])) // PASISVE mode
    await executeCommand(connection, Buffer.from([0x84])) // FULL mode
    await executeCommand(
        connection,
        Buffer.from([0x8c, 0x3, 0x1, 0x40, 0x10, 0x8d, 0x3]),
    ) // Beep
}

export const createConnetion = () => {
    const connection = new SerialPort(
        SERIAL,
        {
            baudRate: BAUD_RATE,
        },
        async error => {
            if (error) {
                console.error(
                    `Got the following error when intializing SerialPort: ${error}`,
                )
                return
            }

            await sendStartSequence(connection)
        },
    )
    return connection
}

export const executeCommand = async (
    connection: SerialPort,
    command: Buffer,
) => {
    await new Promise<number>((resolve, reject) =>
        connection.write(command, (error, bytesWritten) => {
            if (error) {
                reject(error)
            } else {
                resolve(bytesWritten)
            }
        }),
    )
}
