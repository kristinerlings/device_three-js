import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
//import { GLTFLoader } from 'three/addons/GLTFLoader.js'; // I get network error if I use this one
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'; //use this until I ask the teacher

import portalVertexShader from './shaders/portal/vertex.glsl?raw'; //vite doesn't know about gls. Will get an error so: Will add ? and specify raw (tell it's just a string)
import portalFragmentShader from './shaders/portal/fragment.glsl?raw';

const $canvas = document.querySelector('.webglCanvas');
const scene = new THREE.Scene();

const size = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const camera = new THREE.PerspectiveCamera(
  45,
  size.width / size.height,
  0.1,
  100
);
camera.position.x = 14;
camera.position.y = 15;
camera.position.z = 12;
scene.add(camera);

const orbitControls = new OrbitControls(camera, $canvas);
orbitControls.enableDamping = true;

const renderer = new THREE.WebGLRenderer({
  canvas: $canvas,
  //alpha: true,
  antialias: true,
});

//set size of renderer to size object at top.
renderer.setSize(size.width, size.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// ========   BAKED   ======== //
const textureBlender = new THREE.TextureLoader().load(
  'assets/bakedTesting.jpg'
);
textureBlender.flipY = -1; //y axis of textures I load is inverted
const material = new THREE.MeshBasicMaterial({ map: textureBlender });

//CHECK documentation: shader material
//uniforms: pass data from js to shader (vertex and fragment)
// ========   PORTAL/Screen-device   ======== //
//look at the uniforms in the fragment shader (currently I have all of them, need to work this out). iTime and iResolution are the ones I need to pass in.
//Pass in iTime and iResolution as uniforms to my shader material: (iTime is a float, iResolution is a vector2)
const deviceDisplayPlaneMaterial = new THREE.ShaderMaterial({
  uniforms: {
    iTime: { value: 0.0 },
    iResolution: { value: new THREE.Vector2(size.width, size.height) },
  },
  vertexShader: portalVertexShader,
  fragmentShader: portalFragmentShader,
});

// ========   LOADER   ======== //
const loader = new GLTFLoader(); //to be able to load gltf files - blender

// Load a glTF resource
loader.load(
  // resource URL
  'assets/gameDeviceFour.glb',
  // called when the resource is loaded
  (gltf) => {
    console.log('gltf:', gltf);
    //loop through each of the children (assign the model to all of the children):
    gltf.scene.traverse((child) => {
      console.log('traverse, blender child name:', child.name);
      if (child.name === 'screenShader001') { //display shaderToy on device screen
        child.material = deviceDisplayPlaneMaterial;
      } else{
        child.material = material; //child of material, is same as material
      }
    });
    scene.add(gltf.scene);

    // gltf.animations; // Array<THREE.AnimationClip>
    // gltf.scene; // THREE.Group
    // gltf.scenes; // Array<THREE.Group>
    // gltf.cameras; // Array<THREE.Camera>
    //  gltf.asset; // Object
  },
  // called while loading is progressing
  (xhr) => {
    console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
  },
  // called when loading has errors
  (error) => {
    console.log('An error happened');
  }
);

//test object: create simple cube
//const geometry = new THREE.BoxGeometry(1, 1, 1);

/* const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
console.log(cube); */


// ========   Animate my shader: update iTime /in my animation loop(keep the animation running)  ======== //
const clock = new THREE.Clock(); //to get the time

//Draw loop that executes the renderer
const draw = () => {
  //update time
  const timePassed = clock.getElapsedTime(); //get time passed since clock started - returns seconds passed and updates iTime
  deviceDisplayPlaneMaterial.uniforms.iTime.value = timePassed; //update iTime in my shader - 

  //
  renderer.render(scene, camera); //draw the scene
  window.requestAnimationFrame(draw); //call the draw function again to make it loop :D !
};

//on resize -> update size, camera and renderer
window.addEventListener('resize', () => {
  //Update size
  size.width = window.innerWidth;
  size.height = window.innerHeight;

  //update camera
  camera.aspect = size.width / size.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(size.width, size.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  //update iResolution in my shader
  deviceDisplayPlaneMaterial.uniforms.iResolution.value.set(size.width, size.height)
});

draw();
