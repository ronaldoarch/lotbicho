"""
Manual Oficial de Regras - Backend Jogo do Bicho
Implementação Python das funções principais
"""

from itertools import permutations
from typing import List, Set, Dict, Tuple
import secrets


# ============================================================================
# TABELA DE GRUPOS E DEZENAS
# ============================================================================

GRUPOS_DEZENAS = {
    1: (1, 2, 3, 4),      # Avestruz
    2: (5, 6, 7, 8),      # Águia
    3: (9, 10, 11, 12),   # Burro
    4: (13, 14, 15, 16),  # Borboleta
    5: (17, 18, 19, 20),  # Cachorro
    6: (21, 22, 23, 24),  # Cabra
    7: (25, 26, 27, 28),  # Carneiro
    8: (29, 30, 31, 32),  # Camelo
    9: (33, 34, 35, 36),  # Cobra
    10: (37, 38, 39, 40), # Coelho
    11: (41, 42, 43, 44), # Cavalo
    12: (45, 46, 47, 48), # Elefante
    13: (49, 50, 51, 52), # Galo
    14: (53, 54, 55, 56), # Gato
    15: (57, 58, 59, 60), # Jacaré
    16: (61, 62, 63, 64), # Leão
    17: (65, 66, 67, 68), # Macaco
    18: (69, 70, 71, 72), # Porco
    19: (73, 74, 75, 76), # Pavão
    20: (77, 78, 79, 80), # Peru
    21: (81, 82, 83, 84), # Touro/Boi
    22: (85, 86, 87, 88), # Tigre
    23: (89, 90, 91, 92), # Urso
    24: (93, 94, 95, 96), # Veado
    25: (97, 98, 99, 0),  # Vaca (00 = 0)
}


# ============================================================================
# FUNÇÕES DE CONVERSÃO
# ============================================================================

def dezena_para_grupo(dezena: int) -> int:
    """
    Converte uma dezena (00-99) para o grupo correspondente (1-25).
    
    Args:
        dezena: Número de 0 a 99 (00 = 0)
    
    Returns:
        Grupo de 1 a 25
    """
    if dezena == 0:  # 00
        return 25
    
    return ((dezena - 1) // 4) + 1


def milhar_para_grupo(milhar: int) -> int:
    """
    Extrai a dezena de um milhar e retorna o grupo.
    
    Args:
        milhar: Número de 0000 a 9999
    
    Returns:
        Grupo de 1 a 25
    """
    dezena = milhar % 100  # Últimos 2 dígitos
    return dezena_para_grupo(dezena)


def grupos_no_resultado(
    resultados_milhar: List[int],
    pos_from: int,
    pos_to: int
) -> List[int]:
    """
    Converte uma lista de milhares em grupos para um intervalo de posições.
    
    Args:
        resultados_milhar: Lista de milhares (índice 0 = 1º prêmio)
        pos_from: Primeira posição (1-indexed)
        pos_to: Última posição (1-indexed)
    
    Returns:
        Lista de grupos no intervalo
    """
    grupos = []
    for i in range(pos_from - 1, pos_to):
        if i < len(resultados_milhar):
            grupo = milhar_para_grupo(resultados_milhar[i])
            grupos.append(grupo)
    return grupos


# ============================================================================
# CÁLCULOS FINANCEIROS
# ============================================================================

def calcular_valor_por_palpite(
    valor_digitado: float,
    qtd_palpites: int,
    divisao_tipo: str  # 'each' ou 'all'
) -> float:
    """
    Calcula o valor por palpite baseado no tipo de divisão.
    
    Args:
        valor_digitado: Valor digitado pelo usuário
        qtd_palpites: Quantidade de palpites no jogo
        divisao_tipo: 'each' para cada palpite, 'all' para todos
    
    Returns:
        Valor por palpite
    """
    if divisao_tipo == 'each':
        return valor_digitado
    else:  # 'all'
        if qtd_palpites == 0:
            return 0.0
        return valor_digitado / qtd_palpites


def calcular_unidades(
    qtd_combinacoes: int,
    pos_from: int,
    pos_to: int
) -> int:
    """
    Calcula o número de unidades de aposta.
    
    Args:
        qtd_combinacoes: Quantidade de combinações do palpite
        pos_from: Primeira posição (1-indexed)
        pos_to: Última posição (1-indexed)
    
    Returns:
        Número de unidades
    """
    qtd_posicoes = pos_to - pos_from + 1
    return qtd_combinacoes * qtd_posicoes


def calcular_valor_unitario(
    valor_por_palpite: float,
    unidades: int
) -> float:
    """
    Calcula o valor unitário de uma aposta.
    
    Args:
        valor_por_palpite: Valor apostado no palpite
        unidades: Número de unidades
    
    Returns:
        Valor unitário
    """
    if unidades == 0:
        return 0.0
    return valor_por_palpite / unidades


def calcular_premio_unidade(
    odd: float,
    valor_unitario: float
) -> float:
    """
    Calcula o prêmio por unidade.
    
    Args:
        odd: Odd da modalidade para o intervalo de posições
        valor_unitario: Valor unitário
    
    Returns:
        Prêmio por unidade
    """
    return odd * valor_unitario


def calcular_premio_palpite(
    acertos: int,
    premio_unidade: float
) -> float:
    """
    Calcula o prêmio total de um palpite.
    
    Args:
        acertos: Número de unidades que acertaram
        premio_unidade: Prêmio por unidade
    
    Returns:
        Prêmio total do palpite
    """
    return acertos * premio_unidade


# ============================================================================
# PERMUTAÇÕES (PARA MODALIDADES INVERTIDAS)
# ============================================================================

def contar_permutacoes_distintas(numero: str) -> int:
    """
    Conta quantas permutações distintas existem para um número.
    
    Args:
        numero: String com o número (ex: "2580")
    
    Returns:
        Quantidade de permutações distintas
    """
    return len(set(permutations(numero)))


def gerar_permutacoes_distintas(numero: str) -> List[str]:
    """
    Gera todas as permutações distintas de um número.
    
    Args:
        numero: String com o número (ex: "2580")
    
    Returns:
        Lista de permutações distintas como strings
    """
    return sorted(set(''.join(p) for p in permutations(numero)))


# ============================================================================
# SORTEIO INSTANTÂNEO
# ============================================================================

def gerar_resultado_instantaneo(qtd_premios: int = 5) -> List[int]:
    """
    Gera um resultado instantâneo (lista de milhares sorteadas).
    
    Args:
        qtd_premios: Quantidade de prêmios a sortear (ex: 5 para 1º ao 5º)
    
    Returns:
        Lista de milhares, índice 0 = 1º prêmio
    """
    return [secrets.randbelow(10000) for _ in range(qtd_premios)]


# ============================================================================
# CONFERÊNCIA DE MODALIDADES
# ============================================================================

def conferir_grupo_simples(
    resultado: List[int],
    grupo_apostado: int,
    pos_from: int,
    pos_to: int
) -> int:
    """
    Confere um palpite de grupo simples.
    
    Args:
        resultado: Lista de milhares sorteadas
        grupo_apostado: Grupo apostado (1-25)
        pos_from: Primeira posição (1-indexed)
        pos_to: Última posição (1-indexed)
    
    Returns:
        Número de acertos (0 ou 1, ou múltiplos se permitir)
    """
    grupos = grupos_no_resultado(resultado, pos_from, pos_to)
    
    # Opção A: Pagar apenas 1 vez por palpite
    return 1 if grupo_apostado in grupos else 0
    
    # Opção B: Pagar por cada posição que bate
    # return grupos.count(grupo_apostado)


def conferir_dupla_grupo(
    resultado: List[int],
    grupos_apostados: Set[int],
    pos_from: int,
    pos_to: int
) -> int:
    """
    Confere um palpite de dupla de grupo.
    
    Args:
        resultado: Lista de milhares sorteadas
        grupos_apostados: Set com os 2 grupos apostados
        pos_from: Primeira posição (1-indexed)
        pos_to: Última posição (1-indexed)
    
    Returns:
        1 se ambos os grupos aparecerem, 0 caso contrário
    """
    grupos = grupos_no_resultado(resultado, pos_from, pos_to)
    grupos_presentes = set(grupos)
    
    # Ambos os grupos precisam aparecer
    if grupos_apostados.issubset(grupos_presentes):
        return 1
    return 0


def conferir_terno_grupo(
    resultado: List[int],
    grupos_apostados: Set[int],
    pos_from: int,
    pos_to: int
) -> int:
    """
    Confere um palpite de terno de grupo.
    
    Args:
        resultado: Lista de milhares sorteadas
        grupos_apostados: Set com os 3 grupos apostados
        pos_from: Primeira posição (1-indexed)
        pos_to: Última posição (1-indexed)
    
    Returns:
        1 se todos os 3 grupos aparecerem, 0 caso contrário
    """
    grupos = grupos_no_resultado(resultado, pos_from, pos_to)
    grupos_presentes = set(grupos)
    
    if grupos_apostados.issubset(grupos_presentes):
        return 1
    return 0


def conferir_quadra_grupo(
    resultado: List[int],
    grupos_apostados: Set[int],
    pos_from: int,
    pos_to: int
) -> int:
    """
    Confere um palpite de quadra de grupo.
    
    Args:
        resultado: Lista de milhares sorteadas
        grupos_apostados: Set com os 4 grupos apostados
        pos_from: Primeira posição (1-indexed)
        pos_to: Última posição (1-indexed)
    
    Returns:
        1 se todos os 4 grupos aparecerem, 0 caso contrário
    """
    grupos = grupos_no_resultado(resultado, pos_from, pos_to)
    grupos_presentes = set(grupos)
    
    if grupos_apostados.issubset(grupos_presentes):
        return 1
    return 0


def conferir_dezena(
    resultado: List[int],
    dezena_apostada: int,
    pos_from: int,
    pos_to: int
) -> int:
    """
    Confere um palpite de dezena normal.
    
    Args:
        resultado: Lista de milhares sorteadas
        dezena_apostada: Dezena apostada (0-99)
        pos_from: Primeira posição (1-indexed)
        pos_to: Última posição (1-indexed)
    
    Returns:
        Número de acertos (quantas vezes a dezena apareceu)
    """
    acertos = 0
    for i in range(pos_from - 1, pos_to):
        if i < len(resultado):
            dezena_resultado = resultado[i] % 100
            if dezena_resultado == dezena_apostada:
                acertos += 1
    return acertos


def conferir_centena(
    resultado: List[int],
    centena_apostada: int,
    pos_from: int,
    pos_to: int
) -> int:
    """
    Confere um palpite de centena normal.
    
    Args:
        resultado: Lista de milhares sorteadas
        centena_apostada: Centena apostada (0-999)
        pos_from: Primeira posição (1-indexed)
        pos_to: Última posição (1-indexed)
    
    Returns:
        Número de acertos
    """
    acertos = 0
    for i in range(pos_from - 1, pos_to):
        if i < len(resultado):
            centena_resultado = resultado[i] % 1000
            if centena_resultado == centena_apostada:
                acertos += 1
    return acertos


def conferir_milhar(
    resultado: List[int],
    milhar_apostado: int,
    pos_from: int,
    pos_to: int
) -> int:
    """
    Confere um palpite de milhar normal.
    
    Args:
        resultado: Lista de milhares sorteadas
        milhar_apostado: Milhar apostado (0-9999)
        pos_from: Primeira posição (1-indexed)
        pos_to: Última posição (1-indexed)
    
    Returns:
        Número de acertos
    """
    acertos = 0
    for i in range(pos_from - 1, pos_to):
        if i < len(resultado):
            if resultado[i] == milhar_apostado:
                acertos += 1
    return acertos


def conferir_milhar_invertida(
    resultado: List[int],
    milhar_apostado: str,
    pos_from: int,
    pos_to: int
) -> int:
    """
    Confere um palpite de milhar invertida.
    
    Args:
        resultado: Lista de milhares sorteadas
        milhar_apostado: Milhar apostado como string (ex: "2580")
        pos_from: Primeira posição (1-indexed)
        pos_to: Última posição (1-indexed)
    
    Returns:
        Número de acertos (quantas permutações acertaram)
    """
    permutacoes = gerar_permutacoes_distintas(milhar_apostado)
    permutacoes_int = [int(p) for p in permutacoes]
    
    acertos = 0
    for i in range(pos_from - 1, pos_to):
        if i < len(resultado):
            if resultado[i] in permutacoes_int:
                acertos += 1
    return acertos


def conferir_passe(
    resultado: List[int],
    grupo_1: int,
    grupo_2: int
) -> int:
    """
    Confere um palpite de passe normal (1º-2º).
    
    Args:
        resultado: Lista de milhares sorteadas
        grupo_1: Grupo que deve sair no 1º prêmio
        grupo_2: Grupo que deve sair no 2º prêmio
    
    Returns:
        1 se acertou, 0 caso contrário
    """
    if len(resultado) < 2:
        return 0
    
    grupo_1_resultado = milhar_para_grupo(resultado[0])
    grupo_2_resultado = milhar_para_grupo(resultado[1])
    
    if grupo_1_resultado == grupo_1 and grupo_2_resultado == grupo_2:
        return 1
    return 0


def conferir_passe_vai_e_vem(
    resultado: List[int],
    grupo_1: int,
    grupo_2: int
) -> int:
    """
    Confere um palpite de passe vai-e-vem (1º-2º, ordem não importa).
    
    Args:
        resultado: Lista de milhares sorteadas
        grupo_1: Um dos grupos
        grupo_2: Outro grupo
    
    Returns:
        1 se acertou, 0 caso contrário
    """
    if len(resultado) < 2:
        return 0
    
    grupo_1_resultado = milhar_para_grupo(resultado[0])
    grupo_2_resultado = milhar_para_grupo(resultado[1])
    
    # Pode ser grupo_1-grupo_2 ou grupo_2-grupo_1
    if (grupo_1_resultado == grupo_1 and grupo_2_resultado == grupo_2) or \
       (grupo_1_resultado == grupo_2 and grupo_2_resultado == grupo_1):
        return 1
    return 0


# ============================================================================
# EXEMPLO DE USO COMPLETO
# ============================================================================

def exemplo_quadra_grupo():
    """
    Exemplo completo de cálculo de quadra de grupo.
    """
    # Dados do palpite
    grupos_apostados = {1, 6, 15, 25}
    valor_digitado = 1.00
    divisao_tipo = 'each'
    pos_from = 1
    pos_to = 5
    odd_quadra = 5000.0
    
    # 1. Valor por palpite
    valor_por_palpite = calcular_valor_por_palpite(
        valor_digitado, 1, divisao_tipo
    )
    
    # 2. Combinações
    qtd_combinacoes = 1
    
    # 3. Unidades
    unidades = calcular_unidades(qtd_combinacoes, pos_from, pos_to)
    
    # 4. Valor unitário
    valor_unitario = calcular_valor_unitario(valor_por_palpite, unidades)
    
    # 5. Prêmio por unidade
    premio_unidade = calcular_premio_unidade(odd_quadra, valor_unitario)
    
    # 6. Gerar resultado (exemplo)
    resultado = [4321, 0589, 7704, 1297, 5060]
    
    # 7. Conferir
    acertos = conferir_quadra_grupo(
        resultado, grupos_apostados, pos_from, pos_to
    )
    
    # 8. Prêmio do palpite
    premio_palpite = calcular_premio_palpite(acertos, premio_unidade)
    
    return {
        'valor_por_palpite': valor_por_palpite,
        'unidades': unidades,
        'valor_unitario': valor_unitario,
        'premio_unidade': premio_unidade,
        'acertos': acertos,
        'premio_palpite': premio_palpite,
    }


if __name__ == '__main__':
    # Exemplo de uso
    resultado = exemplo_quadra_grupo()
    print(resultado)
