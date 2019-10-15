'use strict';
var __importStar =
  (this && this.__importStar) ||
  function(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod)
        if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result['default'] = mod;
    return result;
  };
Object.defineProperty(exports, '__esModule', { value: true });
const react_1 = __importStar(require('react'));
const react_native_1 = require('../../');
exports.default = () => {
  const [counter, setCounter] = react_1.useState(0);
  react_1.useEffect(() => {
    const timer = setInterval(() => {
      setCounter(prevCounter => prevCounter + 1);
    });
    return () => {
      clearInterval(timer);
    };
  });
  return (
    <react_native_1.View style={{ padding: 1 }}>
      <react_native_1.Text style={{ color: 'green' }}>
        {counter} tests passed
      </react_native_1.Text>
    </react_native_1.View>
  );
};
