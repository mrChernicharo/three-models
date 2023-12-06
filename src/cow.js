import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GUI } from "dat.gui";

let gui; //GUI
let fileUrl; //URL
let glTFLoader; //GLTFLoader
let renderer; //THREE.WebGLRenderer
let scene; //THREE.Scene
let camera;
let orbit;
let ambientLight;
const baseURL = "/assets/Cow.gltf";

function setup() {
  gui = new GUI();
  fileUrl = new URL(baseURL, import.meta.url);
  glTFLoader = new GLTFLoader();
  renderer = new THREE.WebGLRenderer({ antialias: true });
  scene = new THREE.Scene();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0xcbcbcb); // Sets the color of the background
  document.body.appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  orbit = new OrbitControls(camera, renderer.domElement); // Sets orbit control to move the camera around
  camera.position.set(5, 10, 15); // Camera positioning
  orbit.update();

  ambientLight = new THREE.AmbientLight(0xefefef, 0.9);
  scene.add(ambientLight);
}

function drawGrid() {
  // Sets a 12 by 12 gird helper
  const gridHelper = new THREE.GridHelper(12, 12);
  scene.add(gridHelper);

  // Sets the x, y, and z axes with each having a length of 4
  const axesHelper = new THREE.AxesHelper(14);
  scene.add(axesHelper);
}

async function setupAnimalColorGUI() {
  const gltf = await glTFLoader.loadAsync(fileUrl.href);
  const model = gltf.scene;
  scene.add(model);
  console.log({ gltf, model });

  //   navigating the model
  console.log(
    model.children[0].children[0].children[5],
    model.getObjectByName("Cube_5"),
    model.children[0].children[1].children[0],
    model.getObjectByName("Back")
  );

  // const CowArea1 = model.getObjectByName("Cube_1");
  // CowArea1.material.color.setHex(0xff0000);

  const skinnedMeshes = Array.from(model.getObjectByName("Cow").children);

  const donkeyColors = {};
  const donkeyAreas = ["Primary", "Secondary", "Hoofs", "Nose", "EyesOutside", "EyesInside", "Horns"];
  skinnedMeshes.forEach((mesh, i) => {
    // console.log(mesh.name, donkeyAreas[i]);
    donkeyColors[donkeyAreas[i]] = 0xffffff;
    gui.addColor(donkeyColors, donkeyAreas[i]).onChange((e) => {
      model.getObjectByName(mesh.name).material.color.setHex(e);
    });
  });
}

export async function runCowDemo() {
  setup();

  drawGrid();

  await setupAnimalColorGUI();

  renderer.setAnimationLoop(animate);

  window.addEventListener("resize", function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function animate() {
  renderer.render(scene, camera);
}
