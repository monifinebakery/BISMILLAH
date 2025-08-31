/**
 * ESLint Rule: no-select-star
 * Prevents usage of SELECT * in Supabase queries
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow SELECT * in database queries for performance reasons',
      category: 'Best Practices',
      recommended: true
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          allowInTests: {
            type: 'boolean'
          },
          allowInMigrations: {
            type: 'boolean'
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      noSelectStar: 'Avoid using SELECT * for performance. Specify only needed columns.',
      noSelectStarSuggestion: 'Consider using .select(`id, column1, column2`) instead'
    }
  },

  create(context) {
    const options = context.options[0] || {};
    const { allowInTests = true, allowInMigrations = true } = options;
    
    const filename = context.getFilename();
    const isTestFile = /\\.(test|spec)\\.(js|ts|tsx)$/.test(filename);
    const isMigrationFile = /migration|seed/i.test(filename);
    
    // Skip if in allowed files
    if ((allowInTests && isTestFile) || (allowInMigrations && isMigrationFile)) {
      return {};
    }

    return {
      CallExpression(node) {
        // Check for .select('*') calls
        if (
          node.callee &&
          node.callee.type === 'MemberExpression' &&
          node.callee.property &&
          node.callee.property.name === 'select' &&
          node.arguments.length === 1
        ) {
          const arg = node.arguments[0];
          
          // Check for string literal '*'
          if (
            arg.type === 'Literal' &&
            arg.value === '*'
          ) {
            context.report({
              node: arg,
              messageId: 'noSelectStar',
              suggest: [
                {
                  messageId: 'noSelectStarSuggestion',
                  fix(fixer) {
                    return fixer.replaceText(arg, '`\\n  id,\\n  -- TODO: Add specific columns\\n`');
                  }
                }
              ]
            });
          }
          
          // Check for template literal '*'
          if (
            arg.type === 'TemplateLiteral' &&
            arg.quasis.length === 1 &&
            arg.quasis[0].value.raw.trim() === '*'
          ) {
            context.report({
              node: arg,
              messageId: 'noSelectStar',
              suggest: [
                {
                  messageId: 'noSelectStarSuggestion',
                  fix(fixer) {
                    return fixer.replaceText(arg, '`\\n  id,\\n  -- TODO: Add specific columns\\n`');
                  }
                }
              ]
            });
          }
        }
        
        // Check for .select() with object destructuring containing '*'
        if (
          node.callee &&
          node.callee.type === 'MemberExpression' &&
          node.callee.property &&
          node.callee.property.name === 'select'
        ) {
          node.arguments.forEach(arg => {
            if (arg.type === 'Literal' && typeof arg.value === 'string') {
              // Check for patterns like 'table_name(*)'
              if (/\\w+\\(\\s*\\*\\s*\\)/.test(arg.value)) {
                context.report({
                  node: arg,
                  messageId: 'noSelectStar',
                  suggest: [
                    {
                      messageId: 'noSelectStarSuggestion',
                      fix(fixer) {
                        const newValue = arg.value.replace(/\\(\\s*\\*\\s*\\)/, '(id, specific_columns)');
                        return fixer.replaceText(arg, `"${newValue}"`);
                      }
                    }
                  ]
                });
              }
            }
          });
        }
      }
    };
  }
};
