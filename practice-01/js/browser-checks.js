"use strict";

(async () => {
  const target = document.querySelector("#results");
  const cases = [
    ["hello.js", "Тип document: object"],
    ["types.js", "typeof NaN: number | тип: string"],
    ["progress.js", "Статус: Завершено"],
    ["plan.js", "Потребуется дней: 0"],
    ["debug.js", "Контрольная сумма: 10"],
    ["plan-week.js", "Календарных дней: 8"],
  ];
  let passed = 0;
  for (const [file, lastLine] of cases) {
    const lines = [];
    const frame = document.createElement("iframe");
    frame.hidden = true;
    document.body.append(frame);
    frame.contentWindow.console.log = (...args) => lines.push(args.join(" "));
    const script = frame.contentDocument.createElement("script");
    script.src = new URL(`./js/${file}`, location.href).href;
    try {
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Не загружен ${file}`));
        frame.contentWindow.addEventListener("error", event => reject(event.error));
        frame.contentDocument.head.append(script);
      });
      if (lines.at(-1) !== lastLine) throw new Error(`Неожиданный вывод: ${lines.at(-1)}`);
      passed += 1;
      target.textContent += `ПРОЙДЕНО ${file}\n${lines.join("\n")}\n\n`;
    } catch (error) {
      target.textContent += `ОШИБКА ${file}: ${error.message}\n`;
    } finally {
      frame.remove();
    }
  }
  target.textContent += `Итог: ${passed}/${cases.length}`;
  document.querySelector("#summary").textContent = `Итог: ${passed}/${cases.length} файлов успешно выполнены в браузере`;
})();
