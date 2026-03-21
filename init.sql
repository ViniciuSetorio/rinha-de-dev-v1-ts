DROP TABLE IF EXISTS reservas;
DROP TABLE IF EXISTS eventos;

CREATE TABLE eventos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    ingressos_disponiveis INTEGER NOT NULL
);

CREATE TABLE reservas (
    id SERIAL PRIMARY KEY,
    evento_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_evento FOREIGN KEY (evento_id) REFERENCES eventos(id)
);

-- Inserir o evento oficial da Rinha
-- O ID 1 será o alvo fixo do script de teste k6
INSERT INTO eventos (id, nome, ingressos_disponiveis) 
VALUES (1, 'I Rinha de Dev - Campus Picos', 100);