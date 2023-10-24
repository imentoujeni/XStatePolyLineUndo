import Stack from "./stack.js";

class UndoManager{
    constructor(buttonUndo, buttonRedo){
        this.buttonUndo = buttonUndo
        this.buttonRedo = buttonRedo
        this.undoStack = new Stack()
        this.redoStack = new Stack()
    }

    getUndoStack(){
        return this.undoStack;
    }

    getRedoStack(){
        return this.redoStack;
    }

    execute(command){
        this.undoStack.push(command)
        this.buttonUndo.disabled = this.canUndo()
        this.buttonRedo.disabled = this.canRedo()
    }

    undo(){
        let command = this.undoStack.peek()
        command.undo()
        this.redoStack.push(command)
        this.undoStack.pop()
        this.buttonUndo.disabled = this.canUndo()
        this.buttonRedo.disabled = this.canRedo()
    }

    canUndo(){
        if(!this.undoStack.isEmpty()){
            return false
        }
        return true
    }

    redo(){
        let commande = this.redoStack.peek()
        commande.redo()
        this.undoStack.push(commande)
        this.redoStack.pop()
        this.buttonUndo.disabled = this.canUndo()
        this.buttonRedo.disabled = this.canRedo()
    }

    canRedo(){
        if(!this.redoStack.isEmpty()){
            return false
        }
        return true
    }
}
export default UndoManager;