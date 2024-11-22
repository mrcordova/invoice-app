const deleteDialog = document.querySelector("#delete-dialog");
const editDialog = document.querySelector("#edit-invoice-dialog");
const body = document.querySelector("body");

body.addEventListener("click", (e) => {
  const deleteDialogTarget = e.target.closest("[data-show-delete-dialog]");
  const editDialogTarget = e.target.closest("[data-show-edit-dialog]");

  if (deleteDialogTarget) {
    deleteDialog.showModal();
  } else if (editDialogTarget) {
    editDialog.showModal();
  }
});
