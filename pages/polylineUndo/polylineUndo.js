import Stack from './stack';
import Konva from "konva";
import { createMachine, interpret } from "xstate";
import UndoManager from './UndoManager.js'
class UndoCommand {
    constructor(polyline, dessin){
        this.polyline = polyline
        this.dessin = dessin
    }

    undo(){
        this.polyline.remove()
    }

    redo(){
        this.dessin.add(this.polyline)
    }
}

const stage = new Konva.Stage({
            container: "container",
            width: 400,
            height: 400,
        });

        const temporaire = new Konva.Layer();
        stage.add(dessin);
        stage.add(temporaire);

        const MAX_POINTS = 10;
        let polyline 
let buttonUndo = document.getElementById("undo")
let buttonRedo = document.getElementById("redo")

let undoManager = new UndoManager(buttonUndo, buttonRedo);

buttonUndo.addEventListener("click", () => { undoManager.undo() })
buttonRedo.addEventListener("click", () => {undoManager.redo() })

        const polylineMachine = createMachine(
            {
          
                id: "polyLine",
                initial: "idle",
                states: {
                    idle: {
                        on: {
                            MOUSECLICK: {
                                target: "onePoint",
                                actions: "createLine",
                            },
                        },
                    },
                    onePoint: {
                        on: {
                            MOUSECLICK: {
                                target: "manyPoints",
                                actions: "addPoint",
                            },
                            MOUSEMOVE: {
                                actions: "setLastPoint",
                            },
                            Escape: { 
                                target: "idle",
                                actions: "abandon",
                            },
                        },
                    },
                    manyPoints: {
                        on: {
                            MOUSECLICK: [
                                {
                                    actions: "addPoint",
                                    cond: "pasPlein",
                                },
                                {
                                    target: "idle",
                                    actions: ["addPoint", "saveLine"],
                                },
                            ],

                            MOUSEMOVE: {
                                actions: "setLastPoint",
                            },

                            Escape: {
                                target: "idle",
                                actions: "abandon",
                            },

                            Enter: { 
                                target: "idle",
                                actions: "saveLine",
                            },

                            Backspace: [ 
                                {
                                    target: "manyPoints",
                                    actions: "removeLastPoint",
                                    cond: "plusDeDeuxPoints",
                                    internal: true,
                                },
                                {
                                    target: "onePoint",
                                    actions: "removeLastPoint",
                                },
                            ],
                        },
                    },
                },
            },
            {
                actions: {
                    createLine: (context, event) => {
                        const pos = stage.getPointerPosition();
                        polyline = new Konva.Line({
                            points: [pos.x, pos.y, pos.x, pos.y],
                            stroke: "red",
                            strokeWidth: 2,
                        });
                        temporaire.add(polyline);
                    },
                    setLastPoint: (context, event) => {
                        const pos = stage.getPointerPosition();
                        const currentPoints = polyline.points(); // Get the current points of the line
                        const size = currentPoints.length;

                        const newPoints = currentPoints.slice(0, size - 2); // Remove the last point
                        polyline.points(newPoints.concat([pos.x, pos.y]));
                        temporaire.batchDraw();
                    },
                    saveLine: (context, event) => {
                        polyline.remove(); // On l'enlève de la couche temporaire
                        const currentPoints = polyline.points(); // Get the current points of the line
                        const size = currentPoints.length;
                      
                        const newPoints = currentPoints.slice(0, size - 2);
                        polyline.points(newPoints);
                        polyline.stroke("black");
                        dessin.add(polyline); 
                        undoManager.execute(new UndoCommand(polyline, dessin))
                    },
                    addPoint: (context, event) => {
                        const pos = stage.getPointerPosition();
                        const currentPoints = polyline.points(); // Get the current points of the line
                        const newPoints = [...currentPoints, pos.x, pos.y]; // Add the new point to the array
                        polyline.points(newPoints); 
                        temporaire.batchDraw(); 
                    },
                    abandon: (context, event) => {
                        polyline.remove();
                    },
                    removeLastPoint: (context, event) => {
                        const currentPoints = polyline.points(); // Get the current points of the line
                        const size = currentPoints.length;
                        const provisoire = currentPoints.slice(size - 2, size); // Le point provisoire
                        const oldPoints = currentPoints.slice(0, size - 4); // On enlève le dernier point enregistré
                        polyline.points(oldPoints.concat(provisoire)); // Set the updated points to the line
                        temporaire.batchDraw(); // Redraw the layer to reflect the changes
                    },
                },
                guards: {
                    pasPlein: (context, event) => {
                        // On peut encore ajouter un point
                        return polyline.points().length < MAX_POINTS * 2;
                    },
                    plusDeDeuxPoints: (context, event) => {
                        // Deux coordonnées pour chaque point, plus le point provisoire
                        return polyline.points().length > 6;
                    },
                },
            }
        );

        const polylineService = interpret(polylineMachine)
            .onTransition((state) => {
                console.log("Current state:", state.value);
            })
            .start();

        stage.on("click", () => {
            polylineService.send("MOUSECLICK");
        });

        stage.on("mousemove", () => {
            polylineService.send("MOUSEMOVE");
        });

        window.addEventListener("keydown", (event) => {
            console.log("Key pressed:", event.key);
            polylineService.send(event.key);
        });
    