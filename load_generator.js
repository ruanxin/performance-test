// import { Kubernetes } from 'k6/x/kubernetes';
import {check, sleep, fail} from 'k6';
import http from 'k6/http';
import exec from 'k6/x/exec';

const nameSpace = "load-test";

const VU = 20;
const ITERATION = 200;

export const options = {
    scenarios: {
        create_kyma_crs: {
            exec: 'createKymaCRs',
            executor: 'per-vu-iterations',
            vus: VU,
            iterations: ITERATION,
            gracefulStop: '1m',
        },
        // tracking_alerts: {
        //     exec: 'trackingAlerts',
        //     executor: 'constant-arrival-rate',
        //     duration: '3m',
        //     rate: 1,
        //     timeUnit: '10s',
        //     preAllocatedVUs: 1,
        //     maxVUs: 1,
        //     // startTime: '2m', // run after create_configmap
        // }
    },
    thresholds: {
        'checks{scenario:create_kyma_crs}': ['rate==1'], // no errors
        // 'checks{scenario:tracking_alerts}': ['rate==1'], // no alerts
    },

};
const kyma_loadtest_template = open('./manifests-template/operator_loadtest_kyma.yaml')
const module_template_template = open('./manifests-template/operator_moduletemplate_manifest-for-lt_rapid.yaml')

export function createKymaCRs() {
    const kymaName = 'kyma-900' + __VU + '-' + __ITER;
    let kyma = kyma_loadtest_template.replace(/kyma-1-00/, kymaName);
    for (let i = 1; i <= 20; i++) {
        kyma += '    - name: manifest'+ i + '-for-lt'
        kyma += '\n'
    }
    const cmd = "echo " + "'" + kyma + "'" + " | kubectl apply -f -"
    const out = exec.command('bash', ['-c', cmd]);
    console.log("creating: ", kymaName);
    check(out, {'kyma created': (out) => out.includes(kymaName)})
    sleep(1);
}

function deployModuleTemplate() {
    for (let i = 1; i <= 20; i++) {
        const componentName = 'manifest' + i;
        const component = module_template_template.replace(/manifest1/g, componentName);
        const cmd = "echo " + "'" + component + "'" + " | kubectl apply -f -"
        const out = exec.command('bash', ['-c', cmd]);
        console.log("creating: ", componentName);
        console.log("out: ", out);
        check(out, {'component created': (out) => out.includes(componentName)})
        sleep(1);
    }
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


export function setup() {
    deployModuleTemplate()
}

export function teardown(data) {
    console.log("teardown")
    // deleteKymaCRs();
}

