var RifExpression = (function() {
    function Variable(expression) {
        return function (state, stack) {
            stack.push(state[expression]);
        }
    }

    function Constant(expression) {
        var value = parseFloat(expression);
        return function (state, stack) {
            stack.push(value);
        }
    }

    var Not = function (state, stack) {
        stack.push(1.0-stack.pop());
    };

    var And = function (state, stack) {
        stack.push(Math.min(stack.pop(), stack.pop()));
    };

    var Or = function (state, stack) {
        stack.push(Math.max(stack.pop(), stack.pop()));
    };

    function pushOperator(context, operator) {
        context.operators.push(operator);
    }

    function pushOperand(context, operand) {
        context.expressions.push(operand);
    }

    var operators = {
        'not': Not,
        'and': And,
        'or': Or
    };

    function compileNext(part, context) {
        if (part === '') return;
        var operator = operators[part];
        if (operator) {
            pushOperator(context, operator);
        } else if (isNaN(part)) {
            pushOperand(context, Variable(part));
        } else {
            pushOperand(context, Constant(part));
        }
    }

    function splitExpression(expression) {
        return expression.split(' ');
    }

    return {
        compile: function(expression) {
            var context = {
                expressions: [],
                operators: []
            };
            $.each(splitExpression(expression), function(index, value) {
                compileNext(value, context);
            });
            while (context.operators.length !== 0) {
                context.expressions.push(context.operators.pop());
            }
            return context.expressions;
        },
        evaluate: function(compiled_expression, parameters) {
            var stack = [];
            $.each(compiled_expression, function(index, value) {
                value(parameters, stack);
            });
            return stack.length === 1 ? stack.pop() : null;
        }
    };
})();