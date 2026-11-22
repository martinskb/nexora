/** Convite automático para instalar: só no celular, logado, uma vez, e se não foi instalado nem dispensado. */
export const deveConvidar = ({ ehCelular, instalado, dispensado, jaConvidou, logado }) =>
  ehCelular && logado && !instalado && !dispensado && !jaConvidou

/**
 * Como instalar neste navegador: 'nativo' (o navegador oferece o convite),
 * 'ios' (Safari do iPhone/iPad: passo a passo pelo Compartilhar) ou 'indisponivel'.
 */
export function plataformaDeInstalacao(userAgent, temPromptNativo) {
  if (temPromptNativo) return 'nativo'
  if (/iPhone|iPad|iPod/.test(userAgent) && /Safari/.test(userAgent) && !/CriOS|FxiOS|EdgiOS/.test(userAgent)) return 'ios'
  return 'indisponivel'
}
