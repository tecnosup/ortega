📢 **Atualização — Sistema mais leve (manutenção)**
Essa é uma atualização "por baixo do capô": você não vai ver diferença nas telas, mas ela resolve um problema que ia te dar dor de cabeça mais pra frente.

---

**⚠️ O QUE ESTAVA ACONTECENDO**

O sistema guarda os dados num serviço do Google (o Firebase). Esse serviço tem um limite diário de consultas no plano gratuito.

O problema: **cada vez que você abria uma tela do painel** — Início, Agendamentos, Caixa ou Comissões — o sistema ia lá e lia **o histórico inteiro da barbearia**. Todos os agendamentos e todas as comandas, desde o primeiro dia, só pra te mostrar a tela de hoje.

---

**📈 POR QUE ISSO ERA SÉRIO**

Porque o gasto **crescia sozinho**.

Quanto mais a barbearia trabalha, maior fica o histórico — e mais caro fica abrir qualquer tela. Mesmo que o movimento fosse exatamente o mesmo todo mês, o consumo ia subindo mês a mês.

Ou seja: não era um problema que ia se estabilizar. Ia piorar até estourar o limite e o sistema começar a dar erro — foi o que quase aconteceu.

---

**✅ O QUE MUDOU**

Agora o sistema lê **só o período que a tela está mostrando**, em vez do histórico todo.

O resultado prático: **abrir o painel vai custar o mesmo hoje, daqui a um ano e daqui a cinco anos.** O gasto parou de crescer junto com o tamanho do seu histórico. Esse é o ponto principal da atualização.

---

**🔍 MUDA ALGUMA COISA PRA VOCÊ?**

**Não.** Mesmas telas, mesmos dados, mesmas informações.

Seus agendamentos futuros continuam todos aparecendo normalmente na agenda e no calendário — isso foi conferido com cuidado, porque era o risco óbvio de uma mudança dessas.

---

**🔧 PRECISA FAZER ALGO?**

**Não.** Nenhuma mudança no Firebase, nenhuma configuração, nenhuma senha. É só código.

---

**📌 UM PONTO PRA VOCÊ FICAR DE OLHO**

A tela de **Caixa** agora carrega os últimos **90 dias** de comandas — que é a mesma janela dos avisos de "caixa em aberto" que o sistema já te mostra.

Na prática isso cobre a operação normal com folga. Mas se você algum dia precisar mexer em comanda de mais de 3 meses atrás e ela não aparecer, me avisa que eu aumento o período. Não tem nada de errado acontecendo — é só o limite da janela.

---

**💡 EM UMA FRASE**

O sistema não fica mais pesado conforme a barbearia cresce. Antes ficava.
