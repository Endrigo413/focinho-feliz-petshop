"use strict";

const store = require("../../db/store");
const AppError = require("../../lib/AppError");
const { gerarId } = require("../../lib/id");

const posts = () => store.colecao("postsBlog");
const comentarios = () => store.colecao("comentariosBlog");

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resumoPost(p) {
  return {
    id: p.id,
    slug: p.slug,
    titulo: p.titulo,
    resumo: p.resumo,
    categoria: p.categoria,
    autor: p.autor,
    emoji: p.emoji,
    cor: p.cor,
    publicadoEm: p.publicadoEm,
    totalComentarios: comentarios().filter((c) => c.postSlug === p.slug).length
  };
}

function listar({ categoria } = {}) {
  let lista = posts().slice();
  if (categoria) lista = lista.filter((p) => p.categoria === categoria);
  lista.sort((a, b) => (a.publicadoEm < b.publicadoEm ? 1 : -1));
  return {
    total: lista.length,
    categorias: [...new Set(posts().map((p) => p.categoria))].sort(),
    posts: lista.map(resumoPost)
  };
}

function obterPorSlug(slug) {
  const post = posts().find((p) => p.slug === slug);
  if (!post) throw AppError.naoEncontrado("Post não encontrado.");
  const lista = comentarios()
    .filter((c) => c.postSlug === slug)
    .sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : -1))
    .map((c) => ({ id: c.id, nome: c.nome, texto: c.texto, nota: c.nota, criadoEm: c.criadoEm }));
  return { ...post, comentarios: lista };
}

function comentar(slug, usuario, { texto, nota } = {}) {
  const post = posts().find((p) => p.slug === slug);
  if (!post) throw AppError.naoEncontrado("Post não encontrado.");

  texto = String(texto || "").trim();
  if (texto.length < 3) throw new AppError("Escreva um comentário com pelo menos 3 caracteres.");
  if (texto.length > 1200) throw new AppError("Comentário muito longo (máx. 1200 caracteres).");

  let notaNum = null;
  if (nota !== undefined && nota !== null && nota !== "") {
    notaNum = Math.round(Number(nota));
    if (!Number.isFinite(notaNum) || notaNum < 1 || notaNum > 5) throw new AppError("Nota deve ser de 1 a 5.");
  }

  const comentario = {
    id: gerarId("CMT"),
    postSlug: slug,
    usuarioId: usuario.id,
    nome: usuario.nome.split(" ")[0] + (usuario.nome.split(" ")[1] ? " " + usuario.nome.split(" ")[1][0] + "." : ""),
    texto,
    nota: notaNum,
    criadoEm: new Date().toISOString()
  };
  comentarios().push(comentario);
  store.salvar();
  return { id: comentario.id, nome: comentario.nome, texto: comentario.texto, nota: comentario.nota, criadoEm: comentario.criadoEm };
}

/* ---------------------------- admin ---------------------------- */

function criarPost(dados = {}) {
  const titulo = String(dados.titulo || "").trim();
  if (titulo.length < 3) throw new AppError("Informe um título.");
  const conteudo = Array.isArray(dados.conteudo)
    ? dados.conteudo.map(String).filter(Boolean)
    : String(dados.conteudo || "").split(/\n\n+/).map((s) => s.trim()).filter(Boolean);
  if (conteudo.length === 0) throw new AppError("O post precisa de conteúdo.");

  let slug = slugify(dados.slug || titulo);
  const base = slug;
  let i = 2;
  while (posts().some((p) => p.slug === slug)) slug = `${base}-${i++}`;

  const agora = new Date().toISOString();
  const post = {
    id: gerarId("POST"),
    slug,
    titulo,
    resumo: String(dados.resumo || conteudo[0]).slice(0, 240),
    categoria: String(dados.categoria || "Geral"),
    autor: String(dados.autor || "Equipe Focinho Feliz"),
    emoji: String(dados.emoji || "📝").slice(0, 4),
    cor: String(dados.cor || "#1F4B43"),
    publicadoEm: (dados.publicadoEm || agora).slice(0, 10),
    conteudo,
    criadoEm: agora,
    atualizadoEm: agora
  };
  posts().push(post);
  store.salvar();
  return post;
}

function atualizarPost(id, dados = {}) {
  const post = posts().find((p) => p.id === id || p.slug === id);
  if (!post) throw AppError.naoEncontrado("Post não encontrado.");
  if (dados.titulo !== undefined) post.titulo = String(dados.titulo).trim();
  if (dados.resumo !== undefined) post.resumo = String(dados.resumo).slice(0, 240);
  if (dados.categoria !== undefined) post.categoria = String(dados.categoria);
  if (dados.autor !== undefined) post.autor = String(dados.autor);
  if (dados.emoji !== undefined) post.emoji = String(dados.emoji).slice(0, 4);
  if (dados.cor !== undefined) post.cor = String(dados.cor);
  if (dados.conteudo !== undefined) {
    post.conteudo = Array.isArray(dados.conteudo)
      ? dados.conteudo.map(String).filter(Boolean)
      : String(dados.conteudo).split(/\n\n+/).map((s) => s.trim()).filter(Boolean);
  }
  post.atualizadoEm = new Date().toISOString();
  store.salvar();
  return post;
}

function removerPost(id) {
  const lista = posts();
  const i = lista.findIndex((p) => p.id === id || p.slug === id);
  if (i === -1) throw AppError.naoEncontrado("Post não encontrado.");
  const [rem] = lista.splice(i, 1);
  // remove comentários órfãos
  const cms = comentarios();
  for (let k = cms.length - 1; k >= 0; k--) if (cms[k].postSlug === rem.slug) cms.splice(k, 1);
  store.salvar();
  return { removido: rem.id };
}

function listarComentarios() {
  return comentarios()
    .slice()
    .sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : -1))
    .map((c) => {
      const post = posts().find((p) => p.slug === c.postSlug);
      return { ...c, postTitulo: post ? post.titulo : c.postSlug };
    });
}

function removerComentario(id) {
  const cms = comentarios();
  const i = cms.findIndex((c) => c.id === id);
  if (i === -1) throw AppError.naoEncontrado("Comentário não encontrado.");
  cms.splice(i, 1);
  store.salvar();
  return { removido: id };
}

module.exports = {
  listar,
  obterPorSlug,
  comentar,
  criarPost,
  atualizarPost,
  removerPost,
  listarComentarios,
  removerComentario
};
