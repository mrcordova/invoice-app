const deleteDialog = document.querySelector("#delete-dialog");
const body = document.querySelector("body");

body.addEventListener("click", (e) => {
  const deleteDialogTarget = e.target.closest("[data-show-delete-dialog]");

  if (deleteDialogTarget) {
    deleteDialog.showModal();
  }
});
