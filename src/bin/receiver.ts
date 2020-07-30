import {createServer} from "net"
import {createConnetion, executeCommand} from "../serial"

//#region Settings
const LISTEN_HOST = process.env.LISTEN_HOST ?? "0.0.0.0"
const PORT = parseInt(process.env.PORT ?? "5239")
//#endregion

export const main = async () => {
    // const connection = createConnetion()

    const server = createServer(socket => {
        socket.on("data", async buffer => {
            console.log(
                `Executing the following  command: ${buffer.toString("hex")}`,
            )
            // await executeCommand(connection, buffer)
        })
    })
    server.listen(PORT, LISTEN_HOST, () => {
        console.log(`Listening on ${LISTEN_HOST}:${PORT}`)
    })
}

main().catch(console.error)
