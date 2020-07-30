import {Socket} from "net"
import {PromiseSocket} from "promise-socket"
import {combineLatest, merge} from "rxjs"
import {
    debounceTime,
    distinctUntilChanged,
    filter,
    map,
    publish,
    startWith,
} from "rxjs/operators"
import {arrowKeyListener, Key} from "../keypress"
import {unreachable} from "../util"
// @ts-ignore
import struct = require("python-struct")

const KEY_DEBOUNCE_TIME = parseInt(process.env.KEY_DEBOUNCE_TIME ?? "100")
const VELOCITY = parseInt(process.env.ROBOT_VELOCITY ?? "200")
const ROTATION = parseInt(process.env.ROBOT_ROTATION ?? "300")
const PORT = parseInt(process.env.PORT ?? "5239")
const HOST = process.env.HOST ?? "localhost"

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

const main = async () => {
    const client = new PromiseSocket(new Socket())
    await client.connect(PORT, HOST)
    console.log(`Connected to ${HOST}:${PORT}`)

    arrowKeyListener()
        .pipe(
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
        )
        .subscribe(async ([command, name]) => {
            console.log(`SENDING ${name} COMMAND: ${command.toString("hex")}`)
            await client.write(command)
        })
}

main().catch(console.error)
