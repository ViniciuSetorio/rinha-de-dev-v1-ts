import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { Pool } from "pg";

const pool = new Pool({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? "admin",
  password: process.env.DB_PASS ?? "123",
  database: process.env.DB_NAME ?? "rinha",
  min: 4,
  max: 40,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 8_000,
});

pool.on("connect", (client) => {
  client.query("SET synchronous_commit = off;").catch(() => {});
});

interface Reserva {
  evento_id: number;
  usuario_id: number;
}

let ingressosDisponiveis = 100;
let nomeEvento = "I Rinha de Dev - Campus Picos";
let eventoCache: Buffer = Buffer.from("");
const filaReservas: Reserva[] = [];

const atualizaCache = () => {
  eventoCache = Buffer.from(
    JSON.stringify([
      {
        id: 1,
        nome: nomeEvento,
        ingressos_disponiveis: ingressosDisponiveis,
      },
    ]),
  );
};

const sendJson = (res: ServerResponse, statusCode: number, bodyStr: string) => {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(bodyStr),
  });
  res.end(bodyStr);
};

const flushQueue = async () => {
  if (filaReservas.length === 0) return;

  const batch = filaReservas.splice(0, filaReservas.length);
  const qdt = batch.length;
  if (qdt === 0) return;

  try {
    const values: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    for (let i = 0; i < qdt; i++) {
      const r = batch[i];
      values.push(`($${paramIndex++}, $${paramIndex++})`);
      params.push(r.evento_id, r.usuario_id);
    }

    const query = `INSERT INTO reservas (evento_id, usuario_id) VALUES ${values.join(", ")}`;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(query, params);
      await client.query(
        "UPDATE eventos SET ingressos_disponiveis = ingressos_disponiveis - $1 WHERE id = 1",
        [qdt],
      );
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      process.stderr.write(`Erro no batch db: ${err}\n`);
      filaReservas.unshift(...batch);
    } finally {
      client.release();
    }
  } catch (err) {
    process.stderr.write(`Erro na montagem do batch: ${err}\n`);
  }
};

setInterval(flushQueue, 500);

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  if (req.method === "GET" && req.url === "/eventos") {
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Content-Length": eventoCache.length,
    });
    res.end(eventoCache);
    return;
  }

  if (req.method === "POST" && req.url === "/reservas") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        const payload = JSON.parse(body);

        if (
          !payload ||
          typeof payload.evento_id !== "number" ||
          typeof payload.usuario_id !== "number" ||
          payload.evento_id !== 1
        ) {
          return sendJson(res, 400, '{"message":"Requisição inválida."}');
        }

        if (ingressosDisponiveis <= 0) {
          return sendJson(res, 422, '{"message":"Estoque esgotado."}');
        }

        ingressosDisponiveis -= 1;
        atualizaCache();
        filaReservas.push({
          evento_id: payload.evento_id,
          usuario_id: payload.usuario_id,
        });

        return sendJson(res, 201, '{"id":1}');
      } catch (err) {
        return sendJson(res, 400, '{"message":"Formato de JSON inválido."}');
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

const start = async () => {
  try {
    const { rows } = await pool.query<{
      nome: string;
      ingressos_disponiveis: number;
    }>("SELECT nome, ingressos_disponiveis FROM eventos WHERE id = 1 LIMIT 1");

    if (rows.length > 0) {
      nomeEvento = rows[0].nome;
      ingressosDisponiveis = rows[0].ingressos_disponiveis;
    }
  } catch (err) {
    process.stderr.write(`Aviso de carregamento do DB: ${(err as Error).message}\n`);
  }

  atualizaCache();

  server.listen(8080, "0.0.0.0", () => {
    process.stdout.write("Servidor rodando em http://localhost:8080\n");
  });
};

start().catch((err) => {
  process.stderr.write(`Erro de inicialização: ${(err as Error).message}\n`);
  process.exit(1);
});
