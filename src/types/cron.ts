/**
 * A scheduled webhook job (`client.cron`). Distinct from a Function whose
 * `trigger_type` is `'cron'` — that runs your own deployed code, this fires an
 * outbound HTTP request to a URL you configure.
 */
export interface CronJob {
    id: string;
    user_id: string;
    [key: string]: any;
}

export interface JobExecution {
    id: string;
    cron_id: string;
    [key: string]: any;
}
