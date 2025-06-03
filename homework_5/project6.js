var raytraceFS = `
struct Ray {
  vec3 pos;
  vec3 dir;
};

struct Material {
  vec3  k_d;  
  vec3  k_s;  
  float n;   
};

struct Sphere {
  vec3     center;
  float    radius;
  Material mtl;
};

struct Light {
  vec3 position;
  vec3 intensity;
};

struct HitInfo {
  float    t;
  vec3     position;
  vec3     normal;
  Material mtl;
};

uniform Sphere spheres[ NUM_SPHERES ];
uniform Light  lights [ NUM_LIGHTS  ];
uniform samplerCube envMap;
uniform int bounceLimit;

bool IntersectRay(inout HitInfo hit, Ray ray);
bool IntersectShadowRay(Ray ray);

vec3 Shade(Material mtl, vec3 position, vec3 normal, vec3 view) {
  vec3 color = 0.05 * mtl.k_d; // ambient term
  for (int i = 0; i < NUM_LIGHTS; ++i) {
    Ray shadowRay;
    shadowRay.pos = position + 0.001 * normal;
    shadowRay.dir = normalize(lights[i].position - position);

    if (!IntersectShadowRay(shadowRay)) {
      vec3 lightDir = normalize(lights[i].position - position);
      vec3 h_v = normalize(lightDir + view);
      float NdotL = max(dot(normal, lightDir), 0.0);
      float NdotH = max(dot(normal, h_v), 0.0);

      if (NdotL > 0.0) {
        vec3 diff = mtl.k_d * NdotL;
        vec3 spec = mtl.k_s * pow(NdotH, mtl.n);
        color += lights[i].intensity * (diff + spec);
      }
    }
  }
  return color;
}

bool IntersectShadowRay(Ray ray) {
  for (int i = 0; i < NUM_SPHERES; ++i) {
    vec3 p_c = ray.pos - spheres[i].center;
    float a = dot(ray.dir, ray.dir);
    float b = 2.0 * dot(ray.dir, p_c);
    float c = dot(p_c, p_c) - spheres[i].radius * spheres[i].radius;
    float delta = b*b - 4.0*a*c;

    float bias = 0.003;
    if (delta > 0.0) {
      float t = (-b - sqrt(delta)) / (2.0 * a);
      if (t > bias) return true;
    }
  }
  return false;
}

bool IntersectRay(inout HitInfo hit, Ray ray) {
  hit.t = 1e30;
  bool foundHit = false;
  for (int i = 0; i < NUM_SPHERES; ++i) {
    vec3 p_c = ray.pos - spheres[i].center;
    float a = dot(ray.dir, ray.dir);
    float b = 2.0 * dot(ray.dir, p_c);
    float c = dot(p_c, p_c) - spheres[i].radius * spheres[i].radius;
    float delta = b*b - 4.0*a*c;

    if (delta > 0.0) {
      float t = (-b - sqrt(delta)) / (2.0 * a);
      if (t > 0.0 && t < hit.t) {
        hit.t = t;
        hit.position = ray.pos + t * ray.dir;
        hit.normal = normalize(hit.position - spheres[i].center);
        hit.mtl = spheres[i].mtl;
        foundHit = true;
      }
    }
  }
  return foundHit;
}

vec4 RayTracer(Ray ray) {
  HitInfo hit;
  if (IntersectRay(hit, ray)) {
    vec3 view = normalize(-ray.dir);
    vec3 clr = Shade(hit.mtl, hit.position, hit.normal, view);

    vec3 k_s = hit.mtl.k_s;
    for (int bounce = 0; bounce < MAX_BOUNCES; ++bounce) {
      if (bounce >= bounceLimit) break;
      if (dot(k_s, vec3(1.0)) <= 0.0) break;

      Ray reflRay;
      reflRay.dir = reflect(ray.dir, hit.normal);
      reflRay.pos = hit.position + 0.001 * reflRay.dir;

      HitInfo reflHit;
      if (IntersectRay(reflHit, reflRay)) {
        vec3 reflView = normalize(-reflRay.dir);
        vec3 reflColor = Shade(reflHit.mtl, reflHit.position, reflHit.normal, reflView);
        clr += k_s * reflColor;

        ray = reflRay;
        hit = reflHit;
        k_s *= reflHit.mtl.k_s;
      } else {
        clr += k_s * textureCube(envMap, reflRay.dir.xzy).rgb;
        break;
      }
    }
    return vec4(clr, 1.0);
  } else {
    return vec4(textureCube(envMap, ray.dir.xzy).rgb, 1.0);
  }
}
`;
