-- Origem da venda: registrada no balcão ou recebida pelo WhatsApp.
-- Integrações futuras (ex.: marketplaces) podem acrescentar novos valores.
ALTER TABLE vendas
  ADD COLUMN canal ENUM('balcao','whatsapp') NOT NULL DEFAULT 'balcao' AFTER status;
