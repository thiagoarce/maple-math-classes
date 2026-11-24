/* Fixed synthetic lesson; no data from the private dashboard. */
window.MAPLE_DEMO_MANIFEST = {
  slot: "maple-demo-volume",
  title: "Demonstração — Área e volume",
  subject: "Matemática HS",
  year: "Nível ilustrativo",
  goals: ["Relacionar área da base e altura ao volume de um prisma."],
  criteria: ["Prever o efeito de mudar as dimensões e justificar a relação."],
  routine: ["Prever", "Experimentar", "Registrar", "Transferir"],
  resources: [
    {id:"pdf-demo",title:"Handout de demonstração (PDF anotável)",pdfUrl:"fixtures/volume-demo.pdf"},
    {id:"volume",title:"Laboratório de volumetria",htmlUrl:"../simulators/volume/index.html"},
    {id:"pergunta",title:"Questão de investigação",text:"Se duplicarmos a área da base e reduzirmos a altura à metade, o que acontece com o volume? Justifique antes de testar."}
  ]
};
