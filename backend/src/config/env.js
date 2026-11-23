import 'dotenv/config';

const isTest = process.env.NODE_ENV === 'test';
const nodeEnv = process.env.NODE_ENV || 'development';

function required(name) {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name} (veja backend/.env.example)`);
  }
  return value;
}

const jwtSecret = required('JWT_SECRET');
if (jwtSecret.length < 32) {
  throw new Error('JWT_SECRET deve ter pelo menos 32 caracteres.');
}

const sessaoDias = Number(process.env.SESSAO_DIAS) || 7;

// Conexão criptografada com o banco (obrigatória em bancos na nuvem, ex.: Aiven).
// DB_SSL_CA: conteúdo do certificado da autoridade (ca.pem) do provedor.
// DB_SSL=true sem CA: usa os certificados públicos do sistema.
function sslDoBanco() {
  const ca = process.env.DB_SSL_CA;
  if (ca) return { ca: ca.replace(/\\n/g, '\n'), rejectUnauthorized: true };
  if (process.env.DB_SSL === 'true') return { rejectUnauthorized: true };
  return undefined;
}

export const env = Object.freeze({
  nodeEnv,
  isTest,
  isProduction: nodeEnv === 'production',
  port: Number(process.env.PORT) || 3333,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: required('DB_USER'),
    password: process.env.DB_PASSWORD ?? '',
    database: isTest ? required('DB_NAME_TEST') : required('DB_NAME'),
    ssl: sslDoBanco(),
  },
  // Quantos proxies confiáveis existem na frente da API (ex.: Vercel → Render = 2).
  // Necessário para o limite de tentativas usar o IP real de quem acessa.
  trustProxy: Number(process.env.TRUST_PROXY) || 0,
  sessao: {
    segredo: jwtSecret,
    dias: sessaoDias,
    cookie: 'nexora_sessao',
  },
  // Tentativas de login/cadastro por IP a cada 15 minutos
  limiteTentativasAuth: isTest ? 1000 : 10,
});
