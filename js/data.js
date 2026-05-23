// --- FILE: js/data.js ---

if (!localStorage.getItem("users")) {
  localStorage.setItem("users", JSON.stringify([]));
}

const duLieuPhongTroMau = [
  {
  
  },
  {
    
  },
  {
  
  }
];

if (!localStorage.getItem("rooms")) {
  localStorage.setItem("rooms", JSON.stringify(duLieuPhongTroMau));
}