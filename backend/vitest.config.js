import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Os testes compartilham o banco nexora_test: rodar arquivos em sequência evita interferência.
    fileParallelism: false,
  },
});
