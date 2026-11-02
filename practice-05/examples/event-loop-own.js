// Дополнительный обработчик поставлен после регистрации D и продолжения E.
import "./event-loop.js";
Promise.resolve().then(() => console.log("G: собственная микрозадача Promise"));
