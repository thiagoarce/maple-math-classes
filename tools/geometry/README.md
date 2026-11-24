# Figuras matemáticas — plano cartesiano

Primeiro incremento da biblioteca SVG. Implementação independente inspirada no gerador cartesiano existente, com API parcial e sem dependências externas (somente biblioteca padrão do Python). Nenhum arquivo escolar, asset institucional ou integração operacional foi copiado.

## Exemplo

Execute a partir da raiz do projeto, com Python 3:

```python
from tools.geometry.svg_plane import CartesianPlane
from pathlib import Path

p = CartesianPlane(xmin=-3, xmax=3, ymin=-3, ymax=3)
p.grid().axes()
p.line_through((-1,-2),(1,2))
p.point(1,2,"A")
p.circle(0,0,1,color=p.C_GREEN)
Path("exemplo.svg").write_text(p.render(),encoding="utf-8")
```

Abra exemplo.svg no navegador ou incorpore o resultado em HTML.

## Contrato

- Janela cartesiana, eixos, grade, pontos, rótulos, segmentos, retas infinitas, horizontais, verticais e circunferências.
- Eixo vertical positivo para cima; retas e segmentos são recortados na janela matemática.
- A grade usa múltiplos do passo a partir de zero; o limite é de 1000 intervalos por eixo.
- Circunferências exigem escalas iguais e devem caber inteiramente na janela.
- Cores literais hexadecimais; texto serializado por ElementTree. Sem IDs ou marcadores compartilhados.
- A ordem das chamadas é a ordem de desenho; pontos e rótulos podem ficar fora da janela.
- Não é uma substituição integral da implementação anterior: curvas amostradas, regiões poligonais, arcos, setas dos eixos e triângulos de inclinação não foram migrados neste incremento. O desenho e a formatação também não são idênticos.

## Testes

```sh
python -m unittest discover -s tests -v
```

A suíte cobre transformação, recorte, circunferências, validação de parâmetros, texto, cores, independência de eixos e determinismo. Não certifica renderização em todos os navegadores, impressão, acessibilidade ou entradas numéricas extremas.

Próximo incremento: completar a API com curvas, regiões, arcos e exemplos visuais, antes de integrá-la a geradores de materiais.
