import { formatBlogDate } from "./blog-viewer";
import { safeLink } from "./site-nav";

// NOTE: THIS MODULE IS CURRENTLY A WORK-IN-PROGRESS. Use with caution.

export class Config {
    requires: string;
    args: any;

    constructor(config: Config) {
        this.requires = config.requires;
        this.args = config.args;
    }
}

export class DataRequest {
    name: string;
    requestURL: string;
    requestParams: string[];

    constructor(name: string = '', requestURL: string = '', requestParams: string[] = []) {
        this.name = name;
        this.requestURL = requestURL;
        this.requestParams = requestParams;
    }
}

class DataPayload {
    name: string;
    payload: any;

    constructor(name: string) {
        this.name = name;
    }
}

const has = (val: any) => val !== undefined;

const formatDate = (timestamp: string, dateFormat: string) => {
    if (dateFormat === undefined) {
        return formatBlogDate(timestamp); // Default format
    }

    const date = new Date(timestamp);

    if (isNaN(date.getTime())) return "Invalid date";

    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'numeric' });
    const year = date.getFullYear();

    if (dateFormat === 'GR-U') {
        const result = `${month}.${day}.${year}`;
        
        return result.padStart(13, ' '); // 13 = uniform length
    }
}

export const requestData = async (url: string, ...params: string[]) => {
    try {
        const searchParams = new URLSearchParams(window.location.search);
        
        let query = '';
        params.forEach(p => {
            const value = searchParams.get(p);
            if (p) {
                query += `${(query === '' ? '?' : '&')}${p}=${value}`;
            }
        });
        url += query;

        const result = await fetch(url);

        if (!result.ok) {
            throw new Error(`Failed to fetch item(s).`);
        }

        return await result.json();
    } catch (e) {
        console.log(e);
        return null;
    }
}

const scriptButton = async (button: HTMLButtonElement, config: Config, ...data: DataPayload[]) => {
    if (!has(config.args) || !has(config.args.action)) {
        console.error('scriptButton(): Invalid args provided');
        return;
    }

    const item = data[0];
    console.log(item);
    console.log(config);

    if (config.args.action === 'link') {
        const params: any[] = config.args.queryParams || [];
        let query: string = params.reduce((p, i) => {
            let partial = (i > 0) ? '&' : '';

            partial += `${p}=${'value'}`; // TODO: Define 'value' using payload

            return partial;
        });

        if (query !== '') {
            query = '?' + query;
        }

        const hyperlink = await safeLink(`product_viewer.html${query}`);

        button.addEventListener('click', () => { window.location.href = hyperlink; });
    }
}

const buildList = (list: HTMLUListElement, config: Config, ...data: DataPayload[]) => {
    if (!list) {
        console.error('buildList(): Valid list not found');
        return;
    }

    // Ignore if the data is empty
    if (data.length === 1 && !data[0]) {
        return;
    }
    
    const generateListItem = (payload: DataPayload) => {
        const li = document.createElement('li');

        for (const node of config.args) {
            const element = generate(node, '', payload);

            if (element) {
                li.append(element);
            }
        }
        
        return li;
    };

    // Populate the list with each item listed in the payload
    list.append(...data.map((i: any) => generateListItem({
        name: config.requires,
        payload: i[0] // The first index should always be the target item
    })));
};

const functions: { 
    [key: string]: (element: HTMLElement, config: Config, ...data: DataPayload[]) => void 
} = {
    'list': (element: HTMLElement, config: Config, ...data: DataPayload[]) => {
        buildList(element as HTMLUListElement, config, ...data)
    },

    'click': async (element: HTMLElement, config: Config, ...data: DataPayload[]) => {
        await scriptButton(element as HTMLButtonElement, config, ...data);
    }
};

const defineElement = (element: HTMLElement, node: any, payloadData: any) => {
    if (payloadData && has(node.requires)) {
        node.textContent = payloadData[node.textContent] || node.textContent;
    }

    if (has(node.textContent)) {
        let text = node.textContent || '';

        if (has(node.type)) {
            if (node.type === 'date') {
                text = formatDate(node.textContent, node.dateFormat);
            }
        }

        element.textContent = text;
    }

    if (has(node.classList)) {
        element.className = node.classList;
    }
    
    if (has(node.href)) {
        (element as HTMLAnchorElement).href = node.href;
    }

    if (has(node.edit)) {
        element.contentEditable = node.edit;
    }

    if (has(node.function)) {
        const config: Config = { requires: node.requires, args: node.args };
        functions[node.function](element, config, payloadData);
    }
}

const generate = (node: any, id: string, ...requests: DataPayload[]): HTMLElement | null => {
    const element: HTMLElement = document.getElementById(id) || document.createElement(node.tag);

    if (!element) {
        console.error('Invalid tag during element creation:', node.tag);
        return null;
    }

    element.id = has(node.id) ? node.id : id;

    let data; // Null by default

    if (has(node.requires)) {
        data = requests.find(r => r.name === node.requires)?.payload;
    }

    defineElement(element, node, data);
    document.body.appendChild(element);

    // Add child nodes if any
    if (has(node.children)) {
        const children = node.children.map((n: any) => {
            const id = has(n.id) ? n.id : '';
            return generate(n, id, ...requests)
        });
        element.append(...children);
    }

    return element;
} 

export const buildScripts = async (template: any, hideOnLoad = false, ...requests: DataRequest[]) => {
    // Grab all server requests at the start so everything is ready. Remove the bad results
    const requestResults: DataPayload[] = (await Promise.all(
        requests.map(async req => {
            let result = await requestData(req.requestURL, ...req.requestParams);

            // Nullify empty arrays
            if (Array.isArray(result) && result.length === 0) {
                result = null;
            }
            
            return result ? { name: req.name, payload: result } : null;
        }))
    ).filter((item) => item !== null);
    
    // Generate all objects from the template
    for (const [id, value] of Object.entries(template)) {
        generate(value as any, id, ...requestResults);
    }
};