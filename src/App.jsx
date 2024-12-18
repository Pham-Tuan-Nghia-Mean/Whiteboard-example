import { v4 as uuidv4 } from "uuid";
import { Layer, Line, Stage } from "react-konva";
import { useEffect, useRef, useState } from "react";

import { IoMdDownload } from "react-icons/io";
import { LuPencil } from "react-icons/lu";
import { BiEraser } from "react-icons/bi";
import { BiSolidEraser } from "react-icons/bi";
import { PiEraserDuotone } from "react-icons/pi";
import { FaArrowRotateLeft } from "react-icons/fa6";
import { FaArrowRotateRight } from "react-icons/fa6";
import { ACTIONS } from "./constants";

export default function App() {
  const line = localStorage.getItem("scribbles");
  const stageRef = useRef();
  const [action, setAction] = useState(ACTIONS.SCRIBBLE);
  const [fillColor, setFillColor] = useState("#ff0000");
  const [scribbles, setScribbles] = useState(JSON.parse(line) || []);
  const [history, setHistory] = useState({
    step: scribbles.length - 1,
    lineList: scribbles,
  });

  const isPaining = useRef(false);

  function onPointerDown() {
    if (
      [
        ACTIONS.ERASER_ALL,
        ACTIONS.UNDO,
        ACTIONS.REDO,
        ACTIONS.ERASER_ALL,
      ].includes(action)
    )
      return;

    const stage = stageRef.current;
    const { x, y } = stage.getPointerPosition();
    const idElement = stage?.pointerClickStartShape?.attrs?.id;
    const newScribbles = scribbles.filter((i) => i.id !== idElement);
    const id = uuidv4();
    isPaining.current = true;

    switch (action) {
      case ACTIONS.SCRIBBLE:
        setScribbles((scribbles) => [
          ...scribbles,
          {
            id,
            points: [x, y],
            fillColor,
            tool: "pen",
          },
        ]);
        break;
      case ACTIONS.ERASER:
        setScribbles((scribbles) => [
          ...scribbles,
          {
            id,
            points: [x, y],
            fillColor,
            tool: "eraser",
          },
        ]);
        break;
      case ACTIONS.ERASER_ELEMENT:
        setScribbles(newScribbles);

        break;
    }
  }
  function onPointerMove(e) {
    if (!isPaining.current) return;
    if (action === ACTIONS.ERASER_ELEMENT) {
      const idElement = e?.target?.attrs?.id
      const newScribbles = scribbles.filter((i) => i.id !== idElement);
      setScribbles(newScribbles);
      return;
    }
    
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    let lastLine = scribbles[scribbles.length - 1];
    lastLine.points = lastLine.points.concat([point.x, point.y]);
    scribbles.splice(scribbles.length - 1, 1, lastLine);
    setScribbles(scribbles.concat());
  }

  function onPointerUp() {
    isPaining.current = false;
  }

  function handleExport() {
    const uri = stageRef.current.toDataURL();
    var link = document.createElement("a");
    link.download = "image.png";
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const handleUndo = () => {
    if (history.step === 0) {
      return;
    }
    setAction(ACTIONS.UNDO);
    const newScribbles = [...scribbles];
    newScribbles.pop();
    setScribbles(newScribbles);
    setHistory((pre) => ({ ...pre, step: pre.step - 1 }));
  };

  const handleRedo = () => {
    if (history.step === history.lineList.length - 1) return;
    setAction(ACTIONS.REDO);
    const next = history.lineList[history.step + 1];
    setScribbles((scribbles) => [...scribbles, next]);
    setHistory((pre) => ({ ...pre, step: pre.step + 1 }));
  };

  useEffect(() => {
    localStorage.setItem("scribbles", JSON.stringify(scribbles));
  }, [scribbles]);

  useEffect(() => {
    if (!isPaining.current) return;
    setHistory({ step: scribbles?.length - 1, lineList: scribbles });
  }, [scribbles, isPaining]);
  return (
    <>
      <div className="relative w-full h-screen overflow-hidden">
        {/* Controls */}
        <div className="absolute top-0 z-10 w-full py-2 ">
          <div className="flex justify-center items-center gap-3 py-2 px-3 w-fit mx-auto border shadow-lg rounded-lg">
            <button
              className={
                action === ACTIONS.SCRIBBLE
                  ? "bg-violet-300 p-1 rounded"
                  : "p-1 hover:bg-violet-100 rounded"
              }
              onClick={() => {
                setAction(ACTIONS.SCRIBBLE);
              }}
            >
              <LuPencil size={"1.5rem"} />
            </button>
            <button
              className={
                action === ACTIONS.ERASER
                  ? "bg-violet-300 p-1 rounded"
                  : "p-1 hover:bg-violet-100 rounded"
              }
              onClick={() => {
                setAction(ACTIONS.ERASER);
              }}
            >
              <BiEraser size={"2rem"} />
            </button>
            <button
              className={
                action === ACTIONS.ERASER_ELEMENT
                  ? "bg-violet-300 p-1 rounded"
                  : "p-1 hover:bg-violet-100 rounded"
              }
              onClick={() => {
                setAction(ACTIONS.ERASER_ELEMENT);
              }}
            >
              <PiEraserDuotone size={"2rem"} />
            </button>
            <button
              className={
                action === ACTIONS.ERASER_ALL
                  ? "bg-violet-300 p-1 rounded"
                  : "p-1 hover:bg-violet-100 rounded"
              }
              onClick={() => {
                setAction(ACTIONS.ERASER_ALL);
                setScribbles([]);
              }}
            >
              <BiSolidEraser size={"2rem"} />
            </button>
            <button
              className={
                action === ACTIONS.UNDO
                  ? "bg-violet-300 p-1 rounded"
                  : "p-1 hover:bg-violet-100 rounded"
              }
              onClick={() => handleUndo()}
            >
              <FaArrowRotateLeft size={"2rem"} />
            </button>
            <button
              className={
                action === ACTIONS.REDO
                  ? "bg-violet-300 p-1 rounded"
                  : "p-1 hover:bg-violet-100 rounded"
              }
              onClick={() => handleRedo()}
            >
              <FaArrowRotateRight size={"2rem"} />
            </button>
            <button>
              <input
                className="w-6 h-6"
                type="color"
                value={fillColor}
                onChange={(e) => setFillColor(e.target.value)}
              />
            </button>

            <button onClick={handleExport}>
              <IoMdDownload size={"1.5rem"} />
            </button>
          </div>
        </div>
        {/* Canvas */}
        <Stage
          ref={stageRef}
          width={window.innerWidth}
          height={window.innerHeight}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <Layer>
            {scribbles.map((scribble) => (
              <Line
                id={scribble.id}
                key={scribble.id}
                lineCap="round"
                lineJoin="round"
                points={scribble.points}
                stroke={scribble.fillColor}
                strokeWidth={scribble.tool === "eraser" ? 12 : 4}
                globalCompositeOperation={
                  scribble.tool === "eraser" ? "destination-out" : "source-over"
                }
              />
            ))}
          </Layer>
        </Stage>
      </div>
    </>
  );
}
