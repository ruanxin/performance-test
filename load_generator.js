import { Kubernetes } from 'k6/x/kubernetes';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import {check, sleep, fail} from 'k6';
import http from 'k6/http';


const nameSpace = "load-test";
const kubernetes = new Kubernetes({
    // config_path: "/path/to/kube/config", ~/.kube/config by default
})

export const options = {
    scenarios: {
        // create_configmap: {
        //     exec: 'createConfigmap',
        //     executor: 'ramping-vus',
        //     startVUs: 0,
        //     stages: [
        //         { duration: '1m', target: 100 },
        //         { duration: '1m', target: 200 },
        //         { duration: '1m', target: 0 }
        //     ]
        // },
        list_configmaps: {
            exec: 'listConfigmaps',
            executor: 'constant-vus',
            vus: 20,
            duration: '1m',
            // startTime: '2m', // run after create_configmap
        },
        // list_pods: {
        //     exec: 'listPods',
        //     executor: 'constant-vus',
        //     vus: 100,
        //     duration: '1m',
        //     startTime: '2m', // run after create_configmap
        // },
        tracking_alerts: {
            exec: 'trackingAlerts',
            executor: 'constant-arrival-rate',
            duration: '3m',
            rate: 1,
            timeUnit: '10s',
            preAllocatedVUs: 1,
            maxVUs: 1,
            // startTime: '2m', // run after create_configmap
        }
    },
    thresholds: {
        // 'checks{scenario:create_configmap}': ['rate==1'], // no errors
        'iteration_duration{scenario:list_configmaps}': ['p(95)<2000'], //95% of requests should be below 2s
        // 'iteration_duration{scenario:list_pods}': ['p(95)<200'], //95% of requests should be below 200ms
        'checks{scenario:tracking_alerts}': ['rate==1'], // no alerts
    },

};


export function createConfigmap() {
    const name = uuidv4();
    kubernetes.config_maps.apply(getConfigMapYaml(name), nameSpace);

    // const configMap = kubernetes.config_maps.get(name, nameSpace)
    // check(configMap, {'ConfigMap was created': (c) => c.name === name});
    sleep(1);
}


export function listConfigmaps() {
    kubernetes.config_maps.list(nameSpace)
    sleep(1);
}

export function listPods() {
    kubernetes.pods.list(nameSpace)
    sleep(1);
}

export function trackingAlerts() {
    const apiToken = 'eyJrIjoiYTJpUTRSeVJuRTVUc1BDN3Y5SHdLalNLVGs3N3VBdXkiLCJuIjoidGVzdCIsImlkIjoxfQ==';
    const requestHeaders = {
        'User-Agent': 'k6',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiToken,
    };

    const params = {
        headers: requestHeaders,
    };
    const res = http.get('http://localhost:3000/api/alertmanager/grafana/api/v2/alerts', params);
    res.json().forEach( alert => {
        console.log(alert['status']['state'])
        if (alert['status']['state'] === 'active') {
            check(alert, {'alert triggered': false})
        }
    })
}
export function teardown(data) {
    console.log(data)
}

function getConfigMapYaml(name) {
    return `kind: ConfigMap 
apiVersion: v1 
metadata:
  name: ` + name + `
  labels:
     app.kubernetes.io/created-by: load-test
data:
  configkey: configvalue
  configfile: | 
    configproperty1=42
    configproperty2=foo
`
}