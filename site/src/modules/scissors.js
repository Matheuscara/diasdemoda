import {
  ACESFilmicToneMapping,
  AmbientLight,
  AnimationMixer,
  Box3,
  DirectionalLight,
  Group,
  LoopRepeat,
  MathUtils,
  MeshStandardMaterial,
  PMREMGenerator,
  PerspectiveCamera,
  PointLight,
  Scene,
  Sphere,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const MODEL_URL = new URL('../assets/models/scissors.glb', import.meta.url).href;

/** Aço polido das lâminas e cabos — o modelo vem com um único material branco. */
const STEEL = new MeshStandardMaterial({
  color: 0xc6ccd6,
  metalness: 0.95,
  roughness: 0.19,
  envMapIntensity: 1.35,
});

/** Dourado reservado ao parafuso, único uso da cor no guia da marca. */
const GOLD = new MeshStandardMaterial({
  color: 0xc9a24b,
  metalness: 0.95,
  roughness: 0.28,
});

// O modelo é normalizado para raio 1 e a câmera é posicionada a partir da
// esfera envolvente — que não muda com a rotação, então a ponta da tesoura
// nunca sai do quadro, em nenhum ângulo nem proporção de tela.
const MODEL_RADIUS = 1;
const FLOAT_Y = 0.06;
const SCROLL_DRIFT = 0.22;
const POINTER_SHIFT = 0.08;
// a folga de scroll entra parcialmente: o desvio máximo só acontece quando o
// herói já está saindo da tela, e reservar tudo deixaria a tesoura pequena
const FIT_RADIUS = MODEL_RADIUS + FLOAT_Y + POINTER_SHIFT + SCROLL_DRIFT * 0.5;
const FIT_MARGIN = 1.03;

export function initScissors(container, { reducedMotion = false } = {}) {
  if (!container) return { setScrollProgress() {}, dispose() {} };

  const canvasHost = container;
  const scene = new Scene();

  const camera = new PerspectiveCamera(32, 1, 0.1, 100);

  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.style.cssText = 'width:100%;height:100%;display:block';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  canvasHost.appendChild(renderer.domElement);

  const pmrem = new PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.05);
  scene.environment = environment.texture;

  scene.add(new AmbientLight(0xffffff, 0.34));

  const key = new DirectionalLight(0xfff6f2, 3.1);
  key.position.set(4.5, 6, 8);
  scene.add(key);

  const rim = new DirectionalLight(0xe1adb1, 2.6);
  rim.position.set(-6, -1.5, 4);
  scene.add(rim);

  const bounce = new PointLight(0xae567c, 42, 40);
  bounce.position.set(-4, 3.5, 6);
  scene.add(bounce);

  // orbit gira com o scroll/ponteiro; pivot só centraliza o modelo e nunca é animado
  const orbit = new Group();
  scene.add(orbit);

  let mixer = null;
  let clipDuration = 0;
  let model = null;
  let ready = false;

  const state = {
    scrollProgress: 0,
    pointerX: 0,
    pointerY: 0,
    smoothX: 0,
    smoothY: 0,
  };

  new GLTFLoader().load(
    MODEL_URL,
    (gltf) => {
      model = gltf.scene;

      model.traverse((node) => {
        if (!node.isMesh) return;
        node.castShadow = false;
        node.receiveShadow = false;
        node.material = node.parent?.name === 'Obj_Screw_3' ? GOLD : STEEL;
      });

      // esfera envolvente: invariante à rotação, ao contrário da caixa
      const sphere = new Box3().setFromObject(model).getBoundingSphere(new Sphere());
      const scale = MODEL_RADIUS / sphere.radius;

      const pivot = new Group();
      model.position.copy(sphere.center).negate();
      pivot.scale.setScalar(scale);
      pivot.add(model);
      orbit.add(pivot);

      if (gltf.animations.length > 0) {
        mixer = new AnimationMixer(model);
        const action = mixer.clipAction(gltf.animations[0]);
        action.setLoop(LoopRepeat, Infinity);
        action.play();
        clipDuration = gltf.animations[0].duration;
        mixer.setTime(clipDuration * 0.35);
      }

      ready = true;
      container.dataset.ready = 'true';
    },
    undefined,
    (error) => {
      console.error('[scissors] falha ao carregar o modelo', error);
      container.dataset.error = 'true';
    },
  );

  const resize = () => {
    const { clientWidth, clientHeight } = canvasHost;
    if (clientWidth === 0 || clientHeight === 0) return;
    renderer.setSize(clientWidth, clientHeight, false);
    camera.aspect = clientWidth / clientHeight;

    // o enquadramento tem de respeitar o menor dos dois campos de visão:
    // num container estreito o limite é o horizontal, não o vertical
    const verticalFov = camera.fov * MathUtils.DEG2RAD;
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
    const fov = Math.min(verticalFov, horizontalFov);
    camera.position.z = (FIT_RADIUS / Math.sin(fov / 2)) * FIT_MARGIN;

    camera.updateProjectionMatrix();
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvasHost);
  resize();

  const onPointerMove = (event) => {
    state.pointerX = (event.clientX / window.innerWidth) * 2 - 1;
    state.pointerY = (event.clientY / window.innerHeight) * 2 - 1;
  };

  if (!reducedMotion) {
    window.addEventListener('pointermove', onPointerMove, { passive: true });
  }

  let visible = true;
  const visibilityObserver = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
    },
    { threshold: 0 },
  );
  visibilityObserver.observe(canvasHost);

  let frame = 0;
  let previous = performance.now();
  let elapsed = 0;

  const render = (now) => {
    frame = requestAnimationFrame(render);
    const delta = Math.min((now - previous) / 1000, 0.05);
    previous = now;

    if (!visible || document.hidden || !ready) return;

    elapsed += delta;

    if (mixer && clipDuration > 0) {
      if (reducedMotion) {
        mixer.setTime(clipDuration * 0.35);
      } else {
        // o corte avança sozinho e ganha impulso conforme a página rola
        const time = (elapsed * 0.42 + state.scrollProgress * clipDuration * 2.2) % clipDuration;
        mixer.setTime(time);
      }
    }

    if (reducedMotion) {
      orbit.rotation.set(-0.12, 0.55, 0.18);
      orbit.position.set(0, 0, 0);
    } else {
      state.smoothX = MathUtils.lerp(state.smoothX, state.pointerX, 0.045);
      state.smoothY = MathUtils.lerp(state.smoothY, state.pointerY, 0.045);

      orbit.rotation.y = 0.55 + state.smoothX * 0.42 + state.scrollProgress * 1.5;
      orbit.rotation.x = -0.12 + state.smoothY * 0.28 + state.scrollProgress * 0.35;
      orbit.rotation.z = 0.18 + Math.sin(elapsed * 0.5) * 0.05;
      orbit.position.y = Math.sin(elapsed * 0.75) * FLOAT_Y - state.scrollProgress * SCROLL_DRIFT;
      orbit.position.x = state.smoothX * POINTER_SHIFT;
    }

    renderer.render(scene, camera);
  };

  frame = requestAnimationFrame(render);

  return {
    setScrollProgress(value) {
      state.scrollProgress = value;
    },
    dispose() {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      mixer?.stopAllAction();
      model?.traverse((node) => {
        if (node.isMesh) node.geometry.dispose();
      });
      STEEL.dispose();
      GOLD.dispose();
      environment.texture.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
