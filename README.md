# AIToolly Product Hunt Data Scraper and Markdown Generator

## Project Overview
This project is a Product Hunt data scraper and Markdown generator based on Cloudflare Worker, D1 database, and OpenAI API. It automatically fetches Product Hunt data, generates Markdown content, and saves all information to a D1 database.

## Project Origin
Inspiration: https://github.com/ViggoZ/producthunt-daily-hot
Thanks to the author: https://github.com/ViggoZ

Based on the original project, the technical solution has been modified:
1. Database uses Cloudflare D1
2. Scheduled tasks use Cloudflare Workers
3. Scripts are deployed on Cloudflare Workers

## Project Structure
- `src/index.js`: Main logic file, responsible for data scraping, processing, and saving.

## Usage Instructions

### Preparation
1. Cloudflare Account Setup:
   - Register a Cloudflare account (if you don't have one).
   - Create a new Worker in Cloudflare.

2. Environment Variable Setup:
   Add the following environment variables in your Cloudflare Worker settings:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `PRODUCTHUNT_CLIENT_ID`: Your Product Hunt API client ID
   - `PRODUCTHUNT_CLIENT_SECRET`: Your Product Hunt API client secret

### Database Setup
3. D1 Database Setup:
   - Create a new D1 database in Cloudflare.
   - Create the following two tables in the database:
     a. `markdown_content` table:
     ```sql
     CREATE TABLE markdown_content (
       date TEXT PRIMARY KEY,
       content TEXT
     );
     ```
     b. `products` table:
     ```sql
     CREATE TABLE products (
       date TEXT,
       name TEXT,
       tagline TEXT,
       description TEXT,
       votes_count INTEGER,
       created_at TEXT,
       featured TEXT,
       website TEXT,
       url TEXT,
       og_image_url TEXT,
       keyword TEXT,
       translated_tagline TEXT,
       translated_description TEXT,
       PRIMARY KEY (date, name)
     );
     ```
   - Bind the D1 database to your Worker, setting the binding name to `DATABASE`.
   - Replace the `database_id` in `wrangler.toml` with your D1 database ID.

### Code Deployment
4. Dependency Installation:
   Run the following command in the project directory to install necessary dependencies:
   ```
   npm install openai
   ```

5. Code Deployment:
   - Copy the provided JavaScript code into your Worker.
   - Ensure the model name in the code is correct (e.g., change "gpt-4o-mini" to "gpt-3.5-turbo" or another available model).

6. Scheduled Task Setup:
   In the Cloudflare Worker settings, set up a scheduled trigger, for example, to run at 1 AM daily:
   ```
   0 1 * * *
   ```

### Testing and Maintenance
7. Deployment and Testing:
   - Deploy your Worker.
   - Manually trigger it once to test if it works properly.
   - Check if the data is successfully saved in the D1 database.

8. Monitoring and Logging:
   - Set up logging for debugging and monitoring.
   - Regularly check the Worker's running status and the data in the D1 database.

9. Security Considerations:
   - Ensure your API keys and client secrets are securely stored.
   - Consider setting API request limits to avoid exceeding usage quotas.

10. Maintenance:
    - Regularly check for updates to the OpenAI and Product Hunt APIs, and update your code accordingly.
    - Monitor D1 database storage usage and clean up data when necessary.

## Conclusion
After completing these steps, your Cloudflare Worker should be able to run automatically every day, fetch Product Hunt data, generate Markdown content, and save all information to the D1 database.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
