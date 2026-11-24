# Slides de condução — Entrepreneurship

O motor de navegação, reveal/focus e composição do Module foi recuperado em tools/rendering/slides_motor.py, slides_y9_lib.py e primitivas.py; identidade.py continua compartilhada com o papel. Proveniência dos blobs: 8cb22b2, 3ceeabab, 87472a2. Preservados o formato 16:9, famílias de lâmina, idioma, cronômetro e briefing. A fixture de Customer discovery é autoral sintética, não uma aula do plano de 2027.

Perfil inicial sem livros, links externos, vídeos ou imagens de modelos: funções correspondentes falham explicitamente até que assets e direitos sejam revisados. O conteúdo HTML é autoral confiável, não sanitizado. Matemática opcional, com o mesmo runtime local; não habilitar em texto monetário sem usar modo de nós.

## Notas
O deck do aluno **não contém notas docentes no HTML por padrão**. O briefing só sai quando briefing_dir é explícito. O modo instructor_notes=True mantém a tecla N original, requer diretório de briefing explícito e é somente para ambiente docente autorizado. N não é controle de acesso nem proteção contra projeção acidental. O teste usa apenas notas sintéticas; não gravar notas privadas em branch pública ou artefatos públicos. Para projeção de um deck real, separar arquivos e testar a integração com Modo Aula antes de usar.

## Testes
PYTHONPATH=. python tests/generate_slides_demo.py; servidor local na raiz; python tests/test_slides_browser.py. Gate verifica navegação, revelações em ordem, desfazer, cronômetro, separação de notas e rede. Usa fontes fallback; fidelidade visual original, revisão dos screenshots e integração de projeção ainda pendentes. Não importar decks históricos ou rotinas avaliativas.

## Papel
Run 45433181593 (28d5c3b): 70 arquivos MathJax verificados. Handout 1 página com 15 SVGs matemáticos, lista 2 páginas com 60 SVGs, zero erros matemáticos de renderização e estouros detectados, 12 itens presentes. Resultado só comprova as fixtures e Chromium, não Safari, fontes originais ou todas as listas.
