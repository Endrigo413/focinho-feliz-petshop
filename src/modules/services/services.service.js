"use strict";

const store = require("../../db/store");
const AppError = require("../../lib/AppError");
const { gerarId } = require("../../lib/id");
const catalogo = require("../../../data/services");

/* -------- Catálogo de serviços da clínica/estética (dados fixos) -------- */

function listarServicos({ categoria } = {}) {
  let itens = [...catalogo];
  if (categoria) itens = itens.filter((s) => s.categoria === categoria);
  return itens;
}

function obterServico(id) {
  const servico = catalogo.find((s) => s.id === id);
  if (!servico) throw AppError.naoEncontrado("Serviço não encontrado.");
  return servico;
}

/* ----------------------------- Agendamentos ----------------------------- */

const agendamentos = () => store.colecao("agendamentos");

function criarAgendamento(dados = {}, usuario) {
  const { cliente, servicoId, pet, data, horario, observacoes } = dados;

  if (!cliente || !cliente.nome || !cliente.telefone) {
    throw new AppError("Informe nome e telefone do cliente.");
  }
  const servico = catalogo.find((s) => s.id === servicoId);
  if (!servico) throw new AppError("Selecione um serviço válido.");
  if (!pet || !pet.nome || !pet.especie) {
    throw new AppError("Informe o nome e a espécie do pet.");
  }
  if (!data || !horario) {
    throw new AppError("Informe a data e o horário desejados.");
  }

  const hoje = new Date().toISOString().slice(0, 10);
  if (String(data) < hoje) {
    throw new AppError("Não é possível agendar para uma data passada.");
  }

  const agora = new Date().toISOString();
  const agendamento = {
    id: gerarId("AGD"),
    usuarioId: usuario ? usuario.id : null,
    cliente,
    pet,
    servico: { id: servico.id, nome: servico.nome, preco: servico.preco },
    data,
    horario,
    observacoes: observacoes || "",
    status: "pendente de confirmação",
    criadoEm: agora
  };

  agendamentos().push(agendamento);
  store.salvar();
  return agendamento;
}

function obterAgendamento(id, usuario) {
  const agendamento = agendamentos().find((a) => a.id === id);
  if (!agendamento) throw AppError.naoEncontrado("Agendamento não encontrado.");

  const restrito = agendamento.usuarioId;
  if (restrito && (!usuario || (usuario.id !== agendamento.usuarioId && usuario.papel !== "admin"))) {
    throw AppError.proibido("Você não tem acesso a este agendamento.");
  }
  return agendamento;
}

module.exports = {
  listarServicos,
  obterServico,
  criarAgendamento,
  obterAgendamento
};
