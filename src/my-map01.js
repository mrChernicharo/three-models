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
const baseURL = "/assets/map04.glb";

function setup() {
  gui = new GUI();
  fileUrl = new URL(baseURL, import.meta.url);
  glTFLoader = new GLTFLoader();
  renderer = new THREE.WebGLRenderer({ antialias: true });
  scene = new THREE.Scene();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x232323); // Sets the color of the background
  document.body.appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  orbit = new OrbitControls(camera, renderer.domElement); // Sets orbit control to move the camera around
  camera.position.set(0, 100, 50); // Camera positioning
  orbit.update();

  ambientLight = new THREE.AmbientLight(0xefefef, 60);
  scene.add(ambientLight);

  window.addEventListener("resize", function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function drawGrid() {
  // Sets a 12 by 12 gird helper
  const gridHelper = new THREE.GridHelper(12, 12);
  scene.add(gridHelper);

  // Sets the x, y, and z axes with each having a length of 4
  const axesHelper = new THREE.AxesHelper(14);
  axesHelper.position.y = 6;
  scene.add(axesHelper);
}

async function drawMap() {
  const glb = await glTFLoader.loadAsync(fileUrl.href);
  const model = glb.scene;

  console.log({ model, glb });

  model.traverse((obj) => {
    if (obj.isMesh) {
      obj.receiveShadow = true;
      obj.castShadow = true;
    }
  });
  // model.getObjectByName("Cube").material = new THREE.MeshPhysicalMaterial({ metalness: 0.9, color: 0xaaaa00 });
  model.getObjectByName("Cube").material = new THREE.MeshMatcapMaterial({
    color: 0x888800,
  });
  // model.getObjectByName("Cube").material = new THREE.MeshDepthMaterial({ wireframe: true });
  // model.getObjectByName("Cube").material = new THREE.MeshNormalMaterial();

  scene.add(model);

  // const mapGeometry = new THREE.BufferGeometry()
}

function drawPathGizmos() {
  const path = [
    // [-10, 10, 0],
    [0, 6, 1],
    [6, 9, 1],
    [6, 6, 13],
    [-2, 6, 13],
    [-2, 6, 19],
    // [10, 10, 0],
    // [10, 10, 10],
  ];
  // .map((pos) => pos.map((v) => v - 0.5));

  const gizmos = [];
  for (const point of path) {
    const geometry = new THREE.SphereGeometry();
    const gizmo = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ color: 0x00ff00 }));
    gizmo.position.set(point[0], point[1], point[2]);
    gizmos.push(gizmo);
  }

  for (const gizmo of gizmos) {
    scene.add(gizmo);
  }
}

// async function setupAnimalColorGUI() {
//   const gltf = await glTFLoader.loadAsync(fileUrl.href);
//   const model = gltf.scene;
//   scene.add(model);
//   console.log({ gltf, model });

//   // navigating the model
//   console.log(
//     model.children[0].children[0].children[5],
//     model.getObjectByName("Cube_5"),
//     model.children[0].children[1].children[0],
//     model.getObjectByName("Back")
//   );

//   // const donkeyArea1 = model.getObjectByName("Cube_1");
//   // donkeyArea1.material.color.setHex(0xff0000);

//   const skinnedMeshes = Array.from(model.getObjectByName("Donkey").children);

//   const donkeyColors = {};
//   const donkeyAreas = ["Primary", "Secondary", "Ears", "Hoofs", "Hair", "Nose", "EyesOutside", "EyesInside"];
//   skinnedMeshes.forEach((mesh, i) => {
//     // console.log(mesh.name, donkeyAreas[i]);
//     donkeyColors[donkeyAreas[i]] = 0xffffff;
//     gui.addColor(donkeyColors, donkeyAreas[i]).onChange((e) => {
//       model.getObjectByName(mesh.name).material.color.setHex(e);
//     });
//   });
// }

export async function runMyMapDemo() {
  setup();

  drawGrid();

  drawMap();

  drawPathGizmos();
  renderer.setAnimationLoop(animate);
}

function animate() {
  renderer.render(scene, camera);
}
