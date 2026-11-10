-- Corrige a exclusão de uma loja que já tem vendas: ao apagar a loja, os produtos
-- caem em cascata, mas itens_venda -> produtos bloqueava a operação.
-- Produtos nunca são apagados fisicamente pelo sistema (só desativados), então
-- a cascata aqui só ocorre quando a loja inteira é excluída.
ALTER TABLE itens_venda
  DROP FOREIGN KEY fk_itens_produto,
  ADD CONSTRAINT fk_itens_produto FOREIGN KEY (produto_id) REFERENCES produtos (id) ON DELETE CASCADE;
