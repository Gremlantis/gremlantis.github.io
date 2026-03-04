const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
camera.position.z = 5;

const canvas = document.getElementById('flagCanvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });

function resizeRendererToDisplaySize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}

// Flag geometry (segments for smooth waving)
const segments = 32;
const geometry = new THREE.PlaneGeometry(3, 3, segments, segments);
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load('/static/img/gremlantis_flag.png');
const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true });
const flag = new THREE.Mesh(geometry, material);
scene.add(flag);

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  resizeRendererToDisplaySize();
  
  const time = clock.getElapsedTime();
  
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i); // horizontal coordinate
    const y = pos.getY(i); // vertical coordinate
    // Wave from left (x=-1.5) to right (x=1.5)
    // Add an offset to make it wave even at the edge slightly for realism
    const weight = (x + 1.5) / 3; 
    pos.setZ(i, 0.25 * weight * Math.sin(5 * x + time * 3.5)); // horizontal wave only
  }
  pos.needsUpdate = true;

  renderer.render(scene, camera);
}

animate();