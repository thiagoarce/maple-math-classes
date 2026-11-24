/* Generated from lessons/demo-proporcao.json; do not edit. */
window.AULA = {
  "id": "DEMO-PROP",
  "produto": "maple",
  "via": [
    {
      "parada": "Mexer",
      "detalhe": "palpite e comparação",
      "telas": [
        {
          "nome": "Pergunta de entrada",
          "aviso": "sem correção agora",
          "itens": [
            {
              "tipo": "palpite",
              "id": "entrada",
              "texto": "3 pedreiros levantam um muro em 12 dias. Com 6 pedreiros no mesmo ritmo, em quantos dias o muro fica pronto?",
              "colunas": [
                "pedreiros",
                "dias"
              ],
              "antes": [
                "3",
                "12"
              ],
              "depois": "6",
              "fator": "×2",
              "opcoes": [
                "24",
                "9",
                "6",
                "4"
              ],
              "certa": 2,
              "seta": "÷2",
              "retorno": [
                "Você marcou 24: dobrou os pedreiros e dobrou os dias. É o erro mais comum. Com mais gente trabalhando, o muro sai mais rápido.",
                "Você marcou 9: tirou 3 dias porque entraram 3 pedreiros. Proporção anda por multiplicação e divisão, não por soma e subtração.",
                "Você marcou 6, e é isso. Dobraram os pedreiros, o tempo caiu pela metade.",
                "Você marcou 4. Diminuir está certo, mas passou do ponto: os pedreiros dobraram, então o tempo cai pela metade."
              ],
              "nota": "Ainda não digo se está certo. A gente volta nesta tabela daqui a pouco."
            }
          ]
        },
        {
          "nome": "Dobre e observe",
          "aviso": "comparação",
          "botao": "Retomar o palpite",
          "itens": [
            {
              "tipo": "setas",
              "nome": "A caixa-d'água",
              "texto": "2 torneiras iguais enchem uma caixa-d'água em 6 horas.",
              "colunas": [
                "torneiras",
                "tempo"
              ],
              "antes": [
                "2",
                "6 h"
              ],
              "depois": [
                "4",
                "3 h"
              ],
              "fator": "×2",
              "acao": "dobrar as torneiras",
              "opcoes": [
                "×2",
                "÷2",
                "+4",
                "×4"
              ],
              "seta": "÷2",
              "veredito": "uma multiplica, a outra divide",
              "classe": "inversa"
            }
          ]
        }
      ]
    },
    {
      "parada": "Quadro",
      "detalhe": "retomada e resolução",
      "telas": [
        {
          "nome": "Retomando a pergunta",
          "itens": [
            {
              "tipo": "volta",
              "rotulo": "Voltando à pergunta do começo",
              "de": "entrada",
              "fecho": "3 × 12 = 36 e 6 × 6 = 36",
              "classe": "inversa"
            }
          ]
        },
        {
          "nome": "Exemplo resolvido",
          "itens": [
            {
              "tipo": "exemplo",
              "rotulo": "Exemplo 1",
              "texto": "Uma impressora faz 90 páginas em 6 minutos. No mesmo ritmo, quantas páginas ela faz em 10 minutos?",
              "colunas": [
                "minutos",
                "páginas"
              ],
              "antes": [
                "6",
                "90"
              ],
              "depois": "10",
              "resposta": "150",
              "pergunta": "O que fica fixo aqui?",
              "opcoes": [
                "a razão",
                "o produto"
              ],
              "certa": 0,
              "erro": "Dobre o tempo: em 12 minutos são 180 páginas. As duas dobram juntas. É direta, e na direta o que fica fixo é a razão.",
              "linhas": [
                "12 min, 180 páginas: dobrou junto. Direta.",
                "90 ÷ 6 = 15 páginas por minuto",
                "15 × 10 = 150 páginas",
                "confere: 150 ÷ 10 = 15"
              ]
            }
          ]
        }
      ]
    },
    {
      "parada": "Praticar",
      "detalhe": "nova situação",
      "telas": [
        {
          "nome": "Prática",
          "itens": [
            {
              "tipo": "valor",
              "texto": "5 kg de arroz custam R$ 30,00. No mesmo preço por quilo, quanto custam 8 kg?",
              "colunas": [
                "kg",
                "preço"
              ],
              "antes": [
                "5",
                "R$ 30,00"
              ],
              "depois": "8",
              "opcoes": [
                [
                  "R$ 18,75",
                  "Essa conta trata a relação como inversa. Mais arroz não pode custar menos."
                ],
                [
                  "R$ 33,00",
                  "Somar 3 porque entraram 3 kg não funciona: cada quilo custa R$ 6,00, não R$ 1,00."
                ],
                [
                  "R$ 48,00",
                  "30 ÷ 5 = 6 reais por quilo, e 6 × 8 = 48."
                ],
                [
                  "R$ 240,00",
                  "Aqui saiu 30 × 8. Os R$ 30,00 são o preço de 5 kg, não de 1 kg."
                ]
              ],
              "certa": 2
            }
          ]
        }
      ]
    },
    {
      "parada": "Topo",
      "detalhe": "verificação curta",
      "telas": [
        {
          "nome": "Verificação de saída",
          "minimo": 1,
          "itens": [
            {
              "tipo": "decide",
              "texto": "Olhe a tabela. Que relação existe entre x e y?",
              "tabela": {
                "colunas": [
                  "x",
                  "y"
                ],
                "linhas": [
                  [
                    "2",
                    "12"
                  ],
                  [
                    "4",
                    "6"
                  ],
                  [
                    "8",
                    "3"
                  ]
                ]
              },
              "opcoes": [
                "direta",
                "inversa",
                "não é proporcional"
              ],
              "certa": 1,
              "comentario": "2 × 12 = 24, 4 × 6 = 24 e 8 × 3 = 24. Produto fixo: inversa."
            }
          ]
        }
      ]
    }
  ],
  "materiais": [],
  "fecho": {},
  "formulas": {}
};
window.AULA_FIGURAS = {};
