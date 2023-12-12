import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { GUI } from "dat.gui";
import { Pathfinding, PathfindingHelper } from "three-pathfinding";

let gui; //GUI
let fileUrl; //URL
// let fbxLoader; //FBXLoader
// let objLoader; //OBJLoader
let glTFLoader; //GLTFLoader
let renderer; //THREE.WebGLRenderer
let scene; //THREE.Scene
let camera;
let orbit;
let ambientLight;
let hemisphereLight;
let bricksTexture;
let stoneTexture;
let mouseRay;
let mouseClickPos = new THREE.Vector2();
let agentGroup;
let navmesh;
let groupId;
let navpath;
let pathfinding;
let pathfindingHelper;
let zone;

// const baseURL = "/assets/MAP-002.glb";
const baseURL = "/assets/MAZE.glb";
const ZONE_ID = "level1";

async function setup() {
  fileUrl = new URL(baseURL, import.meta.url);
  // fbxLoader = new FBXLoader();
  // objLoader = new OBJLoader();
  glTFLoader = new GLTFLoader();
  renderer = new THREE.WebGLRenderer({ antialias: true });
  scene = new THREE.Scene();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x232323); // Sets the color of the background
  document.body.appendChild(renderer.domElement);

  mouseRay = new THREE.Raycaster();

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
  orbit = new OrbitControls(camera, renderer.domElement); // Sets orbit control to move the camera around
  camera.position.set(0, 10, 40); // Camera positioning
  orbit.update();

  ambientLight = new THREE.AmbientLight(0xefefef, 60);
  hemisphereLight = new THREE.HemisphereLight(0xffffff);
  scene.add(ambientLight);
  scene.add(hemisphereLight);

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  window.addEventListener("click", (e) => {
    mouseClickPos.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouseClickPos.y = -(e.clientY / window.innerHeight) * 2 + 1;

    mouseRay.setFromCamera(mouseClickPos, camera);

    const found = mouseRay.intersectObjects(scene.children);
    console.log(found, agentGroup.position);
    if (!found[0]) return;

    let targetPos = found[0].point;
    groupId = pathfinding.getGroup(ZONE_ID, agentGroup.position);
    const closest = pathfinding.getClosestNode(agentGroup.position, ZONE_ID, groupId);

    navpath = pathfinding.findPath(closest.centroid, targetPos, ZONE_ID, groupId);
    console.log({ found, navpath, navmesh, pathfinding, targetPos, agentGroup, closest });

    pathfindingHelper.reset();
    pathfindingHelper.setPlayerPosition(closest);
    pathfindingHelper.setTargetPosition(targetPos);
    if (navpath) {
      pathfindingHelper.setPath(navpath);
    }
  });
}

function drawGrid() {
  // const gridHelper = new THREE.GridHelper(20, 22);
  // const axesHelper = new THREE.AxesHelper(14);
  // //   axesHelper.position.y = 6;
  // scene.add(gridHelper);
  // scene.add(axesHelper);
}

async function loadMapModel() {
  const glb = await glTFLoader.loadAsync(fileUrl.href);
  const model = glb.scene;
  console.log({ glb, bricksTexture, stoneTexture });

  scene.add(model);
  return model;
}

function setupPathfinder(model) {
  pathfinding = new Pathfinding();
  pathfindingHelper = new PathfindingHelper();

  if (!navmesh && model.isObject3D && model.children.length) {
    navmesh = model.getObjectByName("Navmesh");
    pathfinding.setZoneData(ZONE_ID, Pathfinding.createZone(navmesh.geometry));

    console.log("setupPathfinder", { navmesh, pathfinding, pathfindingHelper });
  }
  scene.add(pathfindingHelper);
}

async function setupMapTextures(glb) {
  bricksTexture = await new THREE.TextureLoader().loadAsync("/assets/bricksTexture.jpeg");
  stoneTexture = await new THREE.TextureLoader().loadAsync("/assets/stoneTexture.jpeg");

  glb.traverse((obj, i) => {
    // console.log(obj.name);
    if (obj.isMesh) {
      switch (obj.name) {
        case "Navmesh":
          obj.material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.1 });
          break;
        case "BevelCube":
          {
            //   const texture = new THREE.Texture(bricksTexture, THREE.UVMapping, THREE.RepeatWrapping, THREE.RepeatWrapping);
            const texture = bricksTexture.clone();
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(2, 3);
            obj.material = new THREE.MeshBasicMaterial({ color: 0xca947d, map: texture });
          }
          break;
        case "RBridge":
        case "LBrigde":
          {
            const texture = bricksTexture.clone();
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(1, 7);
            obj.material = new THREE.MeshBasicMaterial({ color: 0xca947d, map: texture });
          }
          //   bricksTexture.repeat.set(2, 3);
          //   obj.material = new THREE.MeshBasicMaterial({ color: 0xca947d, map: bricksTexture });
          break;
        case "LowPlane":
        case "HighPlane":
          const texture = stoneTexture.clone();
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.repeat.set(50, 25);
          obj.material = new THREE.MeshBasicMaterial({ color: 0x898989, map: texture });
          break;
        default:
          {
            const texture = bricksTexture.clone();
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(7, 7);
            obj.material = new THREE.MeshBasicMaterial({ color: 0xca947d, map: texture });
          }
          break;
      }
    }
  });
}

function setupAgent() {
  const agentRadius = 0.25;
  const agentHeight = 1;
  const agentMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(agentRadius, agentRadius, agentHeight),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
  );
  // agentMesh.position.y = agentHeight / 2;
  agentGroup = new THREE.Group();
  agentGroup.add(agentMesh);
  agentGroup.position.x = 9;
  agentGroup.position.z = 8.5;
  agentGroup.position.y = 1.25;
  scene.add(agentGroup);
}

export async function runMyMapDemo2() {
  setup();

  drawGrid();
  setupAgent();

  const model = await loadMapModel();

  await setupMapTextures(model);
  setupPathfinder(model);

  renderer.setAnimationLoop(animate);
}

function animate() {
  renderer.render(scene, camera);
}

//   gui.add
//   gui = new GUI();
//   gui.add(bricksTexture, "repeat");

// const gui = new GUI()
// const cubeFolder = gui.addFolder('Cube')
// cubeFolder.add(cube.rotation, 'x', 0, Math.PI * 2)
// cubeFolder.add(cube.rotation, 'y', 0, Math.PI * 2)
// cubeFolder.add(cube.rotation, 'z', 0, Math.PI * 2)
// cubeFolder.open()
// const cameraFolder = gui.addFolder('Camera')
// cameraFolder.add(camera.position, 'z', 0, 10)
// cameraFolder.open()
