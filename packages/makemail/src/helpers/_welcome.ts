export const welcomeMjml = `
<mjml>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-text>This is your auto-generated welcome page from makemail</mj-text>

        <mj-text>Links:</mj-text>

        {{#each files}}
        <mj-button href="{{this}}" background-color="transparent" color="blue" align="left" padding="0">{{this}}</mj-button>
        {{/each}}
        
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`;
