from mininet.net import Mininet
from mininet.node import Controller, RemoteController, OVSSwitch
from mininet.cli import CLI
from mininet.log import setLogLevel
from mininet.link import TCLink

def create_network():
    net = Mininet(controller=RemoteController, switch=OVSSwitch, link=TCLink)
    
    # POX runs on port 6633 by default
    c0 = net.addController('c0', controller=RemoteController, 
                         ip='127.0.0.1', port=6633)
    
    # Rest of your topology
    s1 = net.addSwitch('s1')
    h1 = net.addHost('h1')
    h2 = net.addHost('h2')
    
    net.addLink(h1, s1)
    net.addLink(h2, s1)
    
    net.start()
    
    # sFlow configuration
    for switch in net.switches:
        switch.cmd('ovs-vsctl -- --id=@sflow create sflow agent=' + switch.name +
                 ' target=\\"127.0.0.1:6343\\" sampling=10 polling=20 -- -- set bridge ' +
                 switch.name + ' sflow=@sflow')
    
    h2.cmd('iperf -s &')
    CLI(net)
    net.stop()

if __name__ == '__main__':
    setLogLevel('info')
    create_network()
