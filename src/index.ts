import {combineLatest, merge} from "rxjs"
import {
    debounceTime,
    distinctUntilChanged,
    filter,
    map,
    publish,
    startWith,
} from "rxjs/operators"
import SerialPort from "serialport"
import {arrowKeyListener, Key} from "./keypress"
import {unreachable} from "./util"
// @ts-ignore
import struct = require("python-struct")

//#region Settings
const SERIAL = process.env.ROBOT_SERIAL ?? "/dev/ttyUSB0"
const BAUD_RATE = parseInt(process.env.ROBOT_BAUD ?? "115200")
const KEY_DEBOUNCE_TIME = parseInt(process.env.KEY_DEBOUNCE_TIME ?? "100")
const VELOCITY = parseInt(process.env.ROBOT_VELOCITY ?? "200")
const ROTATION = parseInt(process.env.ROBOT_ROTATION ?? "300")
//#endregion

const sendStartSequence = async (connection: SerialPort) => {
    await executeCommand(connection, Buffer.from([0x80]), "passive") // PASISVE mode
    await executeCommand(connection, Buffer.from([0x84]), "full") // FULL mode
    await executeCommand(
        connection,
        Buffer.from([0x8c, 0x3, 0x1, 0x40, 0x10, 0x8d, 0x3]),
        "beep",
    ) // Beep
}

export const executeCommand = async (
    connection: SerialPort,
    command: Buffer,
    name: string,
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
    console.log(`[${name.toUpperCase()}]: ${command.toString("hex")}`)
}

const packMovementData = (velocity: number, rotation: number) =>
    struct.pack(">Bhh", 0x91, velocity + rotation / 2, velocity - rotation / 2)

const beepPacket = () => Buffer.from([0x8c, 0x3, 0x1, 0x40, 0x10, 0x8d, 0x3])

const getPacketData = (key: Key | "stop", lastKey: "up" | "down") => {
    switch (key) {
        case "down":
            return packMovementData(-VELOCITY, 0)
        case "left":
            return packMovementData(
                (lastKey === "down" ? -1 : 1) * VELOCITY,
                ROTATION,
            )
        case "right":
            return packMovementData(
                (lastKey === "down" ? -1 : 1) * VELOCITY,
                -ROTATION,
            )
        case "beep":
            return beepPacket()
        case "up":
            return packMovementData(VELOCITY, 0)
        case "stop":
            return packMovementData(0, 0)
        default:
            return unreachable()
    }
}

export const main = async () => {
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

    const obs = arrowKeyListener()
    obs.pipe(
        publish(observable =>
            combineLatest(
                merge(
                    observable,
                    observable.pipe(
                        debounceTime(KEY_DEBOUNCE_TIME),
                        map(() => "stop" as const),
                    ),
                ),
                observable.pipe(
                    filter(key => key === "down" || key === "up"),
                    map(key => key as "down" | "up"),
                    startWith("up" as const),
                ),
            ),
        ),
        distinctUntilChanged((a, b) => a[0] === b[0] && a[1] === b[1]),
        map(([key, last]) => [getPacketData(key, last), key] as const),
    ).subscribe(async ([command, name]) => {
        await executeCommand(connection, command, name)
    })
}

main().catch(console.error)
